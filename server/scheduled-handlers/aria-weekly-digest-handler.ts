import { Request, Response } from "express";
import { getDb } from "../db";
import { ariaLogs, users } from "../../drizzle/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { sdk } from "../_core/sdk";

/**
 * Weekly Aria Digest Handler
 * Sends a summary email every Monday at 9am UTC with:
 * - Top queries and intents
 * - Error rate trends
 * - Unresolved/failed intents
 * - Usage patterns (voice vs text)
 * - Recommendations for improvement
 */
export async function ariaWeeklyDigestHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoStr = oneWeekAgo.toISOString().slice(0, 19).replace("T", " ");

    // Get weekly stats
    const [totalQueries] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ariaLogs)
      .where(sql`${ariaLogs.createdAt} >= ${oneWeekAgoStr}`);

    const [errorCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ariaLogs)
      .where(and(
        sql`${ariaLogs.createdAt} >= ${oneWeekAgoStr}`,
        eq(ariaLogs.status, "error")
      ));

    // Top intents
    const topIntents = await db
      .select({
        intent: ariaLogs.intent,
        count: sql<number>`COUNT(*)`,
      })
      .from(ariaLogs)
      .where(sql`${ariaLogs.createdAt} >= ${oneWeekAgoStr}`)
      .groupBy(ariaLogs.intent)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Input method breakdown
    const inputMethods = await db
      .select({
        method: ariaLogs.inputMethod,
        count: sql<number>`COUNT(*)`,
      })
      .from(ariaLogs)
      .where(sql`${ariaLogs.createdAt} >= ${oneWeekAgoStr}`)
      .groupBy(ariaLogs.inputMethod);

    // Average response time
    const [avgResponse] = await db
      .select({ avg: sql<number>`AVG(response_time_ms)` })
      .from(ariaLogs)
      .where(and(
        sql`${ariaLogs.createdAt} >= ${oneWeekAgoStr}`,
        sql`response_time_ms IS NOT NULL`
      ));

    // Failed queries (for improvement suggestions)
    const failedQueries = await db
      .select({
        question: ariaLogs.question,
        intent: ariaLogs.intent,
        errorMessage: ariaLogs.errorMessage,
      })
      .from(ariaLogs)
      .where(and(
        sql`${ariaLogs.createdAt} >= ${oneWeekAgoStr}`,
        eq(ariaLogs.status, "error")
      ))
      .orderBy(desc(ariaLogs.createdAt))
      .limit(10);

    // Build digest content
    const total = totalQueries?.count || 0;
    const errors = errorCount?.count || 0;
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(1) : "0";
    const avgMs = avgResponse?.avg ? Math.round(avgResponse.avg) : 0;

    const intentBreakdown = topIntents
      .map((i) => `  • ${i.intent}: ${i.count} queries`)
      .join("\n");

    const methodBreakdown = inputMethods
      .map((m) => `  • ${m.method || "unknown"}: ${m.count}`)
      .join("\n");

    const failedList = failedQueries
      .map((f) => `  • "${f.question?.substring(0, 60)}..." → ${f.errorMessage || "unknown error"}`)
      .join("\n");

    // Use LLM to generate recommendations
    let recommendations = "";
    try {
      const llmResponse: any = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are an AI operations analyst. Based on the Aria AI assistant usage data, provide 3-5 concise, actionable recommendations to improve performance. Keep each recommendation to 1-2 sentences.",
          },
          {
            role: "user",
            content: `Weekly Aria stats:
- Total queries: ${total}
- Error rate: ${errorRate}%
- Avg response time: ${avgMs}ms
- Top intents: ${intentBreakdown}
- Input methods: ${methodBreakdown}
- Common failures: ${failedList || "None"}

Provide recommendations to improve Aria's performance and user experience.`,
          },
        ],
      });
      recommendations = llmResponse?.choices?.[0]?.message?.content || "";
    } catch {
      recommendations = "Unable to generate recommendations this week.";
    }

    // Format email
    const weekStart = oneWeekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekEnd = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0A0E1A; color: #E2E8F0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 12px; padding: 32px; border: 1px solid #1E293B; }
    h1 { color: #00D4FF; font-size: 24px; margin-bottom: 4px; }
    h2 { color: #00D4FF; font-size: 18px; margin-top: 24px; border-bottom: 1px solid #1E293B; padding-bottom: 8px; }
    .subtitle { color: #94A3B8; font-size: 14px; margin-bottom: 24px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .stat-card { background: #1E293B; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #00D4FF; }
    .stat-label { font-size: 12px; color: #94A3B8; margin-top: 4px; }
    .list-item { padding: 8px 0; border-bottom: 1px solid #1E293B; font-size: 14px; }
    .error-badge { color: #F87171; }
    .success-badge { color: #34D399; }
    .recommendation { background: #1E293B; border-left: 3px solid #00D4FF; padding: 12px 16px; margin: 8px 0; border-radius: 0 8px 8px 0; font-size: 14px; }
    .footer { text-align: center; color: #64748B; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #1E293B; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 Aria Weekly Digest</h1>
    <p class="subtitle">${weekStart} – ${weekEnd}</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Queries</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${Number(errorRate) > 5 ? 'error-badge' : 'success-badge'}">${errorRate}%</div>
        <div class="stat-label">Error Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgMs}ms</div>
        <div class="stat-label">Avg Response</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${inputMethods.find(m => m.method === "voice")?.count || 0}</div>
        <div class="stat-label">Voice Queries</div>
      </div>
    </div>

    <h2>📊 Top Intents</h2>
    ${topIntents.map(i => `<div class="list-item"><strong>${i.intent}</strong> — ${i.count} queries</div>`).join("")}

    <h2>🎤 Input Methods</h2>
    ${inputMethods.map(m => `<div class="list-item">${m.method || "unknown"}: <strong>${m.count}</strong></div>`).join("")}

    ${failedQueries.length > 0 ? `
    <h2>⚠️ Failed Queries</h2>
    ${failedQueries.map(f => `<div class="list-item"><span class="error-badge">✗</span> "${f.question?.substring(0, 50)}..."</div>`).join("")}
    ` : ""}

    <h2>💡 AI Recommendations</h2>
    ${recommendations.split("\n").filter(r => r.trim()).map(r => `<div class="recommendation">${r.replace(/^\d+\.\s*/, "")}</div>`).join("")}

    <div class="footer">
      <p>GigitekAI Aria Command Center — Automated Weekly Digest</p>
      <p>View full analytics at <a href="https://gigitekai.com/admin/aria-logs" style="color: #00D4FF;">gigitekai.com/admin/aria-logs</a></p>
    </div>
  </div>
</body>
</html>`;

    // Send via SendGrid (using the existing notification infrastructure)
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()).filter(Boolean) || [];
    
    if (adminEmails.length > 0) {
      const sgApiKey = process.env.SENDGRID_API_KEY;
      if (sgApiKey) {
        const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sgApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: adminEmails.map(email => ({ email })) }],
            from: { email: "aria@gigitekai.com", name: "Aria AI Assistant" },
            subject: `🧠 Aria Weekly Digest — ${weekStart} to ${weekEnd}`,
            content: [{ type: "text/html", value: emailHtml }],
          }),
        });

        if (!sgResponse.ok) {
          console.error("[AriaDigest] SendGrid error:", await sgResponse.text());
        } else {
          console.log(`[AriaDigest] Weekly digest sent to ${adminEmails.length} admins`);
        }
      }
    }

    // Also send owner notification
    const { notifyOwner } = await import("../_core/notification");
    await notifyOwner({
      title: "🧠 Aria Weekly Digest",
      content: `Week of ${weekStart}–${weekEnd}: ${total} queries, ${errorRate}% error rate, ${avgMs}ms avg response. Top intent: ${topIntents[0]?.intent || "N/A"} (${topIntents[0]?.count || 0}).`,
    });

    return res.json({
      ok: true,
      stats: { total, errors, errorRate, avgMs },
      sentTo: adminEmails.length,
    });
  } catch (error: any) {
    console.error("[AriaDigest] Handler error:", error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url, taskUid: (req as any).user?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
