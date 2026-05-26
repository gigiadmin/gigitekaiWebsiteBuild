import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import { verifyAdminToken, getAdminSessionCookie } from "../admin-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const parsed = parseCookieHeader(cookieHeader);
  return parsed as Record<string, string>;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First, try to authenticate via admin session (custom JWT)
  try {
    const cookies = parseCookies(opts.req.headers.cookie);
    const adminToken = getAdminSessionCookie(cookies);
    
    if (adminToken) {
      const payload = await verifyAdminToken(adminToken);
      if (payload) {
        // Create a synthetic User object from admin credentials
        // This allows admin queries to work with protectedProcedure/adminProcedure
        user = {
          id: payload.adminId,
          openId: `admin-${payload.adminId}`,
          name: payload.name || null,
          email: payload.email || null,
          loginMethod: "admin",
          role: (payload.role === "admin" ? "admin" : "user") as "admin" | "user" | "technician",
          approved: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSignedIn: new Date().toISOString(),
          deletedAt: null,
        } as User;
        
        console.log(`[Context] Admin session verified for ${payload.email} with role ${payload.role}`);
        return { req: opts.req, res: opts.res, user };
      }
    }
  } catch (error) {
    console.warn("[Context] Admin session verification failed:", error);
  }

  // Fall back to Manus OAuth authentication
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
