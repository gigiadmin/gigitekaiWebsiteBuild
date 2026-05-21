/**
 * Xero OAuth 2.0 Integration Router
 * Handles: OAuth connect/callback, token refresh, invoices, contacts, accounts
 *
 * OAuth flow:
 *   1. Admin clicks "Connect Xero" → GET /api/xero/connect → redirects to Xero
 *   2. Xero redirects back → GET /api/xero/callback → stores tokens → redirects to admin
 *   3. tRPC procedures use stored tokens (auto-refreshing when expired)
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { xeroTokens } from "../../drizzle/schema";
import { adminProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "accounting.transactions",
  "accounting.contacts",
  "accounting.settings",
  "offline_access",
].join(" ");

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Get the redirect URI — must match what's registered in Xero Developer Portal */
function getRedirectUri(): string {
  return `${ENV.isProduction ? "https://gigitekai.com" : "http://localhost:3000"}/api/xero/callback`;
}

/** Exchange authorization code for tokens */
async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}> {
  const credentials = Buffer.from(
    `${ENV.xeroClientId}:${ENV.xeroClientSecret}`
  ).toString("base64");

  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xero token exchange failed: ${err}`);
  }

  return res.json();
}

/** Refresh an expired access token */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(
    `${ENV.xeroClientId}:${ENV.xeroClientSecret}`
  ).toString("base64");

  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xero token refresh failed: ${err}`);
  }

  return res.json();
}

/** Get a valid access token, refreshing if necessary */
async function getValidAccessToken(): Promise<{
  accessToken: string;
  tenantId: string;
} | null> {
  const db = await getDb();
  if (!db) return null;
  const tokens = await db.select().from(xeroTokens).limit(1);
  if (!tokens.length) return null;

  const token = tokens[0];
  const now = new Date();
  const expiresAt = new Date(token.expiresAt);

  // Refresh if expired or within 5 minutes of expiry
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(token.refreshToken);
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

      const dbInst = await getDb();
      if (!dbInst) return null;
      await dbInst
        .update(xeroTokens)
        .set({
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(xeroTokens.id, token.id));

      return { accessToken: refreshed.access_token, tenantId: token.tenantId };
    } catch (err) {
      console.error("[Xero] Token refresh failed:", err);
      return null;
    }
  }

  return { accessToken: token.accessToken, tenantId: token.tenantId };
}

/** Make an authenticated Xero API request */
async function xeroGet(path: string): Promise<unknown> {
  const auth = await getValidAccessToken();
  if (!auth) throw new Error("Xero not connected");

  const res = await fetch(`${XERO_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Xero-tenant-id": auth.tenantId,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xero API error ${res.status}: ${err}`);
  }

  return res.json();
}

// ── Express OAuth Routes (registered in server/_core/index.ts) ─────────────────

import type { Express } from "express";

export function registerXeroOAuthRoutes(app: Express) {
  /** Step 1: Redirect admin to Xero authorization page */
  app.get("/api/xero/connect", (req, res) => {
    if (!ENV.xeroClientId) {
      return res.status(500).json({ error: "Xero client ID not configured" });
    }

    const state = Buffer.from(
      JSON.stringify({ ts: Date.now(), origin: req.headers.origin || "https://gigitekai.com" })
    ).toString("base64");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.xeroClientId,
      redirect_uri: getRedirectUri(),
      scope: XERO_SCOPES,
      state,
    });

    return res.redirect(`${XERO_AUTH_URL}?${params.toString()}`);
  });

  /** Step 2: Handle Xero callback, exchange code for tokens, store them */
  app.get("/api/xero/callback", async (req, res) => {
    const { code, error } = req.query as Record<string, string>;

    if (error) {
      console.error("[Xero] OAuth error:", error);
      return res.redirect(`/admin/xero?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect("/admin/xero?error=missing_code");
    }

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCodeForTokens(code);

      // Get the list of connected Xero organisations (tenants)
      const connectionsRes = await fetch(XERO_CONNECTIONS_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const connections: Array<{ tenantId: string; tenantName: string; tenantType: string }> =
        await connectionsRes.json();

      if (!connections.length) {
        return res.redirect("/admin/xero?error=no_tenants");
      }

      const tenant = connections[0]; // Use the first connected org
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Upsert token record
      const dbInst = await getDb();
      if (!dbInst) throw new Error('Database not available');

      const existing = await dbInst
        .select()
        .from(xeroTokens)
        .where(eq(xeroTokens.tenantId, tenant.tenantId))
        .limit(1);

      if (existing.length) {
        await dbInst
          .update(xeroTokens)
          .set({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt,
            scopes: tokenData.scope,
            tenantName: tenant.tenantName,
            updatedAt: new Date(),
          })
          .where(eq(xeroTokens.tenantId, tenant.tenantId));
      } else {
        await dbInst.insert(xeroTokens).values({
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
          scopes: tokenData.scope,
        });
      }

      console.log(`[Xero] Connected org: ${tenant.tenantName} (${tenant.tenantId})`);
      return res.redirect("/admin/xero?connected=true");
    } catch (err) {
      console.error("[Xero] Callback error:", err);
      return res.redirect(`/admin/xero?error=callback_failed`);
    }
  });

  /** Disconnect Xero — removes stored tokens */
  app.delete("/api/xero/disconnect", async (req, res) => {
    try {
      const dbInst = await getDb();
      if (dbInst) await dbInst.delete(xeroTokens);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to disconnect" });
    }
  });
}

// ── tRPC Router ────────────────────────────────────────────────────────────────

export const xeroRouter = router({
  /** Check if Xero is connected and return org info */
  getStatus: adminProcedure.query(async () => {
    try {
      const db = await getDb();
    if (!db) return { connected: false, tenantName: null, tenantId: null, expiresAt: null };
    const tokens = await db.select().from(xeroTokens).limit(1);
      if (!tokens.length) {
        return { connected: false, tenantName: null, tenantId: null, expiresAt: null };
      }
      const t = tokens[0];
      return {
        connected: true,
        tenantName: t.tenantName,
        tenantId: t.tenantId,
        expiresAt: t.expiresAt,
        scopes: t.scopes,
      };
    } catch {
      return { connected: false, tenantName: null, tenantId: null, expiresAt: null };
    }
  }),

  /** Get invoices from Xero */
  getInvoices: adminProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "SUBMITTED", "AUTHORISED", "PAID", "VOIDED", "DELETED", "ALL"]).optional().default("ALL"),
        page: z.number().optional().default(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const params = new URLSearchParams({
          page: input.page.toString(),
          order: "Date DESC",
        });
        if (input.status !== "ALL") {
          params.set("where", `Status=="${input.status}"`);
        }

        const data = await xeroGet(`/Invoices?${params.toString()}`) as { Invoices?: unknown[] };
        return { invoices: data.Invoices ?? [], error: null };
      } catch (err) {
        return { invoices: [], error: (err as Error).message };
      }
    }),

  /** Get contacts from Xero */
  getContacts: adminProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        searchTerm: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const params = new URLSearchParams({ page: input.page.toString() });
        if (input.searchTerm) {
          params.set("searchTerm", input.searchTerm);
        }

        const data = await xeroGet(`/Contacts?${params.toString()}`) as { Contacts?: unknown[] };
        return { contacts: data.Contacts ?? [], error: null };
      } catch (err) {
        return { contacts: [], error: (err as Error).message };
      }
    }),

  /** Get accounts (chart of accounts) from Xero */
  getAccounts: adminProcedure.query(async () => {
    try {
      const data = await xeroGet("/Accounts") as { Accounts?: unknown[] };
      return { accounts: data.Accounts ?? [], error: null };
    } catch (err) {
      return { accounts: [], error: (err as Error).message };
    }
  }),

  /** Get financial summary — total invoiced, paid, outstanding */
  getFinancialSummary: adminProcedure.query(async () => {
    try {
      // Get authorised + paid invoices for summary
      const [authorised, paid] = await Promise.all([
        xeroGet("/Invoices?where=Status==%22AUTHORISED%22&summaryOnly=true") as Promise<{ Invoices?: Array<{ AmountDue: number; AmountPaid: number; Total: number }> }>,
        xeroGet("/Invoices?where=Status==%22PAID%22&summaryOnly=true") as Promise<{ Invoices?: Array<{ AmountDue: number; AmountPaid: number; Total: number }> }>,
      ]);

      const outstanding = (authorised.Invoices ?? []).reduce(
        (sum, inv) => sum + (inv.AmountDue ?? 0),
        0
      );
      const totalPaid = (paid.Invoices ?? []).reduce(
        (sum, inv) => sum + (inv.Total ?? 0),
        0
      );
      const totalInvoiced = outstanding + totalPaid;

      return {
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        overdueCount: (authorised.Invoices ?? []).filter(
          (inv) => inv.AmountDue > 0
        ).length,
        error: null,
      };
    } catch (err) {
      return {
        totalInvoiced: 0,
        totalPaid: 0,
        outstanding: 0,
        overdueCount: 0,
        error: (err as Error).message,
      };
    }
  }),
});
