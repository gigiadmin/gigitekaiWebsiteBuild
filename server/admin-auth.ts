/**
 * Admin Authentication Helpers
 * Username/password auth for admin portal - bypasses Manus OAuth
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { adminCredentials } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Validate JWT_SECRET is set at startup
if (!process.env.JWT_SECRET) {
  throw new Error(
    "CRITICAL: JWT_SECRET environment variable is required for admin authentication. " +
    "Please set this in your .env file or deployment configuration."
  );
}

// Validate JWT_RESET_SECRET is set at startup
if (!process.env.JWT_RESET_SECRET) {
  throw new Error(
    "CRITICAL: JWT_RESET_SECRET environment variable is required for password reset tokens. " +
    "Please set this in your .env file or deployment configuration. " +
    "IMPORTANT: This must be different from JWT_SECRET."
  );
}

const ADMIN_JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ADMIN_RESET_SECRET = new TextEncoder().encode(process.env.JWT_RESET_SECRET);
const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = "7d";
const RESET_TOKEN_DURATION = "1h";

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

export interface AdminTokenPayload {
  adminId: number;
  email: string;
  name: string;
  role: "admin" | "agent" | "viewer";
  isReset?: boolean;
}

export async function signAdminToken(
  payload: AdminTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(ADMIN_JWT_SECRET);
}

/**
 * Sign a short-lived password reset token (1 hour expiration)
 * Uses separate JWT_RESET_SECRET to prevent session token reuse
 */
export async function signResetToken(
  payload: AdminTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload, isReset: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(RESET_TOKEN_DURATION)
    .sign(ADMIN_RESET_SECRET);
}

/**
 * Verify a password reset token
 * Uses separate JWT_RESET_SECRET
 */
export async function verifyResetToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_RESET_SECRET);
    const tokenPayload = payload as unknown as AdminTokenPayload;
    // Verify it's a reset token
    if (!tokenPayload.isReset) {
      return null;
    }
    return tokenPayload;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    const tokenPayload = payload as unknown as AdminTokenPayload;
    // Reject if it's a reset token (should use verifyResetToken instead)
    if (tokenPayload.isReset) {
      return null;
    }
    return tokenPayload;
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function getAdminSessionCookie(cookies: Record<string, string>): string | undefined {
  return cookies[ADMIN_SESSION_COOKIE];
}

export function buildAdminSessionCookieHeader(token: string, isSecure = true, domain?: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const securePart = isSecure ? "; Secure" : "";
  const domainPart = domain ? `; Domain=${domain}` : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${domainPart}${securePart}`;
}

export function clearAdminSessionCookieHeader(isSecure = true, domain?: string): string {
  const securePart = isSecure ? "; Secure" : "";
  const domainPart = domain ? `; Domain=${domain}` : "";
  return `${ADMIN_SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${domainPart}${securePart}`;
}

// ── Database helpers ──────────────────────────────────────────────────────────

export async function findAdminByEmail(email: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const results = await database
    .select()
    .from(adminCredentials)
    .where(eq(adminCredentials.email, email.toLowerCase().trim()))
    .limit(1);
  return results[0] ?? null;
}

export async function findAdminById(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const results = await database
    .select()
    .from(adminCredentials)
    .where(eq(adminCredentials.id, id))
    .limit(1);
  return results[0] ?? null;
}

export async function createAdminAccount(data: {
  email: string;
  name: string;
  password: string;
  role?: "admin" | "agent" | "viewer";
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const hashedPassword = await hashPassword(data.password);
  await database.insert(adminCredentials).values({
    email: data.email.toLowerCase().trim(),
    name: data.name,
    hashedPassword,
    role: data.role ?? "agent",
    isActive: 1,
  });
  return findAdminByEmail(data.email);
}

export async function updateLastLogin(adminId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .update(adminCredentials)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(adminCredentials.id, adminId));
}

export async function getAllAdminAccounts() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database
    .select({
      id: adminCredentials.id,
      email: adminCredentials.email,
      name: adminCredentials.name,
      role: adminCredentials.role,
      isActive: adminCredentials.isActive,
      createdAt: adminCredentials.createdAt,
      lastLoginAt: adminCredentials.lastLoginAt,
    })
    .from(adminCredentials)
    .orderBy(adminCredentials.createdAt);
}

export async function updateAdminAccount(
  id: number,
  data: { name?: string; role?: "admin" | "agent" | "viewer"; isActive?: boolean; password?: string }
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.role !== undefined) updates.role = data.role;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (data.password !== undefined) updates.hashedPassword = await hashPassword(data.password);
  updates.updatedAt = new Date();

  await database
    .update(adminCredentials)
    .set(updates)
    .where(eq(adminCredentials.id, id));
}

export async function deleteAdminAccount(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.delete(adminCredentials).where(eq(adminCredentials.id, id));
}

// Create default admin account if it doesn't exist
export async function ensureDefaultAdminExists() {
  try {
    const existing = await findAdminByEmail("harry@gigitekai.com");
    if (existing) {
      console.log("[Admin Auth] Default admin account already exists");
      return existing;
    }

    // Validate ADMIN_BOOTSTRAP_PASSWORD is set
    if (!process.env.ADMIN_BOOTSTRAP_PASSWORD) {
      throw new Error(
        "CRITICAL: ADMIN_BOOTSTRAP_PASSWORD environment variable is required to bootstrap admin account. " +
        "Please set this in your .env file or deployment configuration."
      );
    }

    // Create default admin account
    console.log("[Admin Auth] Creating default admin account...");
    const admin = await createAdminAccount({
      email: "harry@gigitekai.com",
      name: "Harry Santiago",
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
      role: "admin",
    });
    console.log("[Admin Auth] Default admin account created successfully");
    return admin;
  } catch (error) {
    console.error("[Admin Auth] Error ensuring default admin:", error);
    return null;
  }
}
