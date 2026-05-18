/**
 * Admin Authentication Helpers
 * Username/password auth for admin portal - bypasses Manus OAuth
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { adminCredentials } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "admin-fallback-secret-change-in-prod"
);
const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = "7d";

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

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return payload as unknown as AdminTokenPayload;
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
    isActive: true,
  });
  return findAdminByEmail(data.email);
}

export async function updateLastLogin(adminId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .update(adminCredentials)
    .set({ lastLoginAt: new Date() })
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

    // Create default admin account
    console.log("[Admin Auth] Creating default admin account...");
    const admin = await createAdminAccount({
      email: "harry@gigitekai.com",
      name: "Harry Santiago",
      password: "YGnali421!!!",
      role: "admin",
    });
    console.log("[Admin Auth] Default admin account created successfully");
    return admin;
  } catch (error) {
    console.error("[Admin Auth] Error ensuring default admin:", error);
    return null;
  }
}
