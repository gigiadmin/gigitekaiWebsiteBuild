import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";

describe("User Account Management - Role Management", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("changeUserRole", () => {
    it("should change a user role from admin to technician", async () => {
      // Create a test user with admin role - use unique IDs
      const uniqueId = `test_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const result = await db.execute(`
        INSERT INTO users (email, name, role, openId, loginMethod, approved)
        VALUES ('test-admin-${Date.now()}@example.com', 'Test Admin', 'admin', '${uniqueId}', 'manual', 1)
      `);

      const userId = (result as any)[0]?.insertId || (result as any).insertId;

      // Change role to technician
      await db.execute(`
        UPDATE users 
        SET role = 'technician', updatedAt = NOW()
        WHERE id = ${userId}
      `);

      // Verify the role was changed
      const updated = await db.execute(`
        SELECT role FROM users WHERE id = ${userId}
      `);

      expect((updated as any)[0].role).toBe("technician");

      // Cleanup
      await db.execute(`DELETE FROM users WHERE id = ${userId}`);
    });

    it("should change a user role from technician to user", async () => {
      const uniqueId = `test_tech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const result = await db.execute(`
        INSERT INTO users (email, name, role, openId, loginMethod, approved)
        VALUES ('test-tech-${Date.now()}@example.com', 'Test Tech', 'technician', '${uniqueId}', 'manual', 1)
      `);

      const userId = (result as any)[0]?.insertId || (result as any).insertId;

      await db.execute(`
        UPDATE users 
        SET role = 'user', updatedAt = NOW()
        WHERE id = ${userId}
      `);

      const updated = await db.execute(`
        SELECT role FROM users WHERE id = ${userId}
      `);

      expect((updated as any)[0].role).toBe("user");

      await db.execute(`DELETE FROM users WHERE id = ${userId}`);
    });
  });

  describe("addUser", () => {
    it("should add a new user with admin role", async () => {
      const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_admin`;

      const result = await db.execute(`
        INSERT INTO users (email, name, role, openId, loginMethod, approved)
        VALUES ('new-admin-${Date.now()}@example.com', 'New Admin', 'admin', '${tempOpenId}', 'manual', 1)
      `);

      const userId = (result as any)[0]?.insertId || (result as any).insertId;

      const user = await db.execute(`
        SELECT id, email, name, role FROM users WHERE id = ${userId}
      `);

      expect((user as any)[0].role).toBe("admin");
      expect((user as any)[0].email).toContain("new-admin");

      await db.execute(`DELETE FROM users WHERE id = ${userId}`);
    });

    it("should add a new user with technician role", async () => {
      const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_tech`;

      const result = await db.execute(`
        INSERT INTO users (email, name, role, openId, loginMethod, approved)
        VALUES ('new-tech-${Date.now()}@example.com', 'New Tech', 'technician', '${tempOpenId}', 'manual', 1)
      `);

      const userId = (result as any)[0]?.insertId || (result as any).insertId;

      const user = await db.execute(`
        SELECT id, email, name, role FROM users WHERE id = ${userId}
      `);

      expect((user as any)[0].role).toBe("technician");
      expect((user as any)[0].email).toContain("new-tech");

      await db.execute(`DELETE FROM users WHERE id = ${userId}`);
    });

    it("should add a new user with user role", async () => {
      const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_user`;

      const result = await db.execute(`
        INSERT INTO users (email, name, role, openId, loginMethod, approved)
        VALUES ('new-user-${Date.now()}@example.com', 'New User', 'user', '${tempOpenId}', 'manual', 1)
      `);

      const userId = (result as any)[0]?.insertId || (result as any).insertId;

      const user = await db.execute(`
        SELECT id, email, name, role FROM users WHERE id = ${userId}
      `);

      expect((user as any)[0].role).toBe("user");
      expect((user as any)[0].email).toContain("new-user");

      await db.execute(`DELETE FROM users WHERE id = ${userId}`);
    });
  });

  describe("getRoleStats", () => {
    it("should return role statistics", async () => {
      // Get current stats
      const result = await db.execute(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users
        WHERE deletedAt IS NULL
        GROUP BY role
      `);

      const stats = {
        admin: 0,
        technician: 0,
        user: 0,
        total: 0,
      };

      if (result && Array.isArray(result)) {
        (result as any).forEach((row: any) => {
          stats[row.role as keyof typeof stats] = row.count;
          stats.total += row.count;
        });
      }

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.admin + stats.technician + stats.user).toBe(stats.total);
    });
  });

  describe("Role transitions", () => {
    it("should support admin -> technician -> user transitions", async () => {
      const tempOpenId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_transition`;

      const result = await db.execute(`
        INSERT INTO users (email, name, role, openId, loginMethod, approved)
        VALUES ('transition-user-${Date.now()}@example.com', 'Transition User', 'admin', '${tempOpenId}', 'manual', 1)
      `);

      const userId = (result as any)[0]?.insertId || (result as any).insertId;

      // Start as admin
      let user = await db.execute(`SELECT role FROM users WHERE id = ${userId}`);
      expect((user as any)[0].role).toBe("admin");

      // Change to technician
      await db.execute(`UPDATE users SET role = 'technician' WHERE id = ${userId}`);
      user = await db.execute(`SELECT role FROM users WHERE id = ${userId}`);
      expect((user as any)[0].role).toBe("technician");

      // Change to user
      await db.execute(`UPDATE users SET role = 'user' WHERE id = ${userId}`);
      user = await db.execute(`SELECT role FROM users WHERE id = ${userId}`);
      expect((user as any)[0].role).toBe("user");

      // Change back to admin
      await db.execute(`UPDATE users SET role = 'admin' WHERE id = ${userId}`);
      user = await db.execute(`SELECT role FROM users WHERE id = ${userId}`);
      expect((user as any)[0].role).toBe("admin");

      await db.execute(`DELETE FROM users WHERE id = ${userId}`);
    });
  });
});
