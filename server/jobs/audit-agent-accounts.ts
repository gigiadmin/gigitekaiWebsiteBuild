import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, notInArray } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Audit agent accounts weekly to prevent unauthorized additions
 * Only nas@gigitekai.com and harry@gigitekai.com should be agents
 */
export async function auditAgentAccounts() {
  console.log("[Agent Audit] Starting weekly agent account audit...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Agent Audit] Database unavailable");
    return { success: false, error: "Database unavailable" };
  }

  const AUTHORIZED_AGENTS = ["nas@gigitekai.com", "harry@gigitekai.com"];

  try {
    // Get all users with admin role (agents)
    const allAdmins = await db.select().from(users).where(eq(users.role, "admin"));

    // Find unauthorized agents
    const unauthorizedAgents = allAdmins.filter(
      (admin) => !AUTHORIZED_AGENTS.includes(admin.email || "")
    );

    if (unauthorizedAgents.length > 0) {
      console.warn(
        `[Agent Audit] Found ${unauthorizedAgents.length} unauthorized agent(s):`,
        unauthorizedAgents.map((a) => a.email)
      );

      // Create audit log entry
      const auditMessage = `⚠️ **SECURITY ALERT: Unauthorized Agent Accounts Detected**

Found ${unauthorizedAgents.length} unauthorized agent account(s) in the system:

${unauthorizedAgents.map((agent) => `- **${agent.name}** (${agent.email}) - ID: ${agent.id}`).join("\n")}

**Authorized agents:**
- nas@gigitekai.com
- harry@gigitekai.com

**Action required:** Review and remove unauthorized accounts immediately.`;

      // Notify owner
      await notifyOwner({
        title: "🚨 Unauthorized Agent Accounts Detected",
        content: auditMessage,
      });

      // Log to database
      await logAuditEvent(db, {
        type: "unauthorized_agents_detected",
        severity: "high",
        count: unauthorizedAgents.length,
        agents: unauthorizedAgents.map((a) => ({ id: a.id, email: a.email || "", name: a.name || "" })),
        timestamp: new Date(),
      });

      return {
        success: true,
        violation: true,
        unauthorizedCount: unauthorizedAgents.length,
        agents: unauthorizedAgents.map((a) => ({ id: a.id, email: a.email || "", name: a.name || "" })),
      };
    }

    console.log("[Agent Audit] ✅ Audit passed - only authorized agents present");

    // Log successful audit
    await logAuditEvent(db, {
      type: "audit_passed",
      severity: "info",
      count: allAdmins.length,
      timestamp: new Date(),
    });

    return {
      success: true,
      violation: false,
      authorizedCount: allAdmins.length,
      message: "All agent accounts are authorized",
    };
  } catch (error) {
    console.error("[Agent Audit] Error during audit:", error);

    await notifyOwner({
      title: "❌ Agent Account Audit Failed",
      content: `An error occurred during the weekly agent account audit: ${error instanceof Error ? error.message : String(error)}`,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Log audit events to a dedicated audit table
 */
async function logAuditEvent(
  db: any,
  event: {
    type: string;
    severity: "info" | "warning" | "high";
    count: number;
    agents?: Array<{ id: number; email: string; name: string }>;
    timestamp: Date;
  }
) {
  try {
    // If you have an audit_logs table, insert here
    // For now, just log to console
    console.log("[Audit Log]", JSON.stringify(event, null, 2));
  } catch (error) {
    console.error("[Audit Log] Failed to log event:", error);
  }
}
