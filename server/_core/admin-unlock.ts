import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

const ADMIN_PASSWORD = "YGnali421!!!";

export function registerAdminUnlockRoutes(app: Express) {
  // GET /admin/unlock?password=YGnali421!!!
  app.get("/admin/unlock", async (req: Request, res: Response) => {
    const { password } = req.query;

    if (password !== ADMIN_PASSWORD) {
      res.redirect("/");
      return;
    }

    try {
      // Use a fixed admin user for emergency access
      const adminEmail = "harry@gigitekai.com";
      const database = await db.getDb();

      if (!database) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }

      // Query user by email
      const userResult = await database
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      let user = userResult.length > 0 ? userResult[0] : null;

      if (!user) {
        // Create admin user if doesn't exist
        const newOpenId = `admin-emergency-${Date.now()}`;
        await db.upsertUser({
          openId: newOpenId,
          email: adminEmail,
          name: "Harry Henry",
          role: "admin",
          approved: true,
          loginMethod: "emergency",
        });

        // Fetch the newly created user
        const newUserResult = await database
          .select()
          .from(users)
          .where(eq(users.email, adminEmail))
          .limit(1);

        user = newUserResult.length > 0 ? newUserResult[0] : null;
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create admin user" });
        return;
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || adminEmail,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie with explicit secure settings
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
        secure: true,
        sameSite: "lax",
        httpOnly: true,
      });

      console.log("[Admin Unlock] Emergency access granted to:", adminEmail);
      res.redirect(302, "/admin");
    } catch (error) {
      console.error("[Admin Unlock] Error:", error);
      res.redirect("/");
    }
  });
}
