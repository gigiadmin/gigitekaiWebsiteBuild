import { adminProcedure } from "../_core/trpc";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { ne } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

const AUTHORIZED_AGENTS = ["nas@gigitekai.com", "harry@gigitekai.com"];

export const agentManagementRouter = {
  /**
   * Get list of unauthorized agents
   */
  getUnauthorizedAgents: adminProcedure.query(async () => {
      const unauthorizedAgents = await db.getDb()
      .select()
      .from(users)
      .where(ne(users.email, null))
      .then((allUsers: any[]) =>
        allUsers.filter(
          (user: any) =>
            user.email &&
            !AUTHORIZED_AGENTS.includes(user.email) &&
            user.role === "admin"
        )
      );

    return {
      count: unauthorizedAgents.length,
      agents: unauthorizedAgents.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      })),
    };
  }),

  /**
   * Remove all unauthorized agents (one-click cleanup)
   */
  removeAllUnauthorizedAgents: adminProcedure.mutation(async ({ ctx }) => {
    try {
      // Get unauthorized agents
      const database = await db.getDb();
      if (!database) throw new Error("Database connection failed");
      const allUsers = await database.select().from(users);
      const unauthorizedAgents = allUsers.filter(
        (user: any) =>
          user.email &&
          !AUTHORIZED_AGENTS.includes(user.email) &&
          user.role === "admin"
      );

      if (unauthorizedAgents.length === 0) {
        return {
          success: true,
          removed: 0,
          message: "No unauthorized agents found",
        };
      }

      // Delete unauthorized agents
      const unauthorizedIds = unauthorizedAgents.map((u: any) => u.id);
      if (!database) throw new Error("Database connection failed");
      await database.delete(users).where((u: any) => unauthorizedIds.includes(u.id));

      // Log audit event
      const removedEmails = unauthorizedAgents
        .map((u: any) => u.email)
        .join(", ");
      const auditMessage = `Removed ${unauthorizedAgents.length} unauthorized agent(s): ${removedEmails}`;

      // Notify owner
      await notifyOwner({
        title: "🧹 Unauthorized Agents Removed",
        content: auditMessage,
      });

      console.log(
        `[Agent Management] ${auditMessage} by ${ctx.user.email}`
      );

      return {
        success: true,
        removed: unauthorizedAgents.length,
        message: `Removed ${unauthorizedAgents.length} unauthorized agent(s)`,
        removedAgents: unauthorizedAgents.map((u: any) => u.email),
      };
    } catch (error) {
      console.error("[Agent Management] Error removing unauthorized agents:", error);
      throw new Error("Failed to remove unauthorized agents");
    }
  }),
};
