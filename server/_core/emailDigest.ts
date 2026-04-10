import { getAdminsForDigest, getDigestSummary, recordDigestHistory, updateDigestPreferencesLastSent } from "../db";
import { sendEmail } from "./email";

export async function generateEmailDigest() {
  console.log("[Email Digest] Starting digest generation...");
  
  try {
    // Get all admins with digest enabled
    const admins = await getAdminsForDigest();
    console.log(`[Email Digest] Found ${admins.length} admins with digest enabled`);

    for (const admin of admins) {
      try {
        // Get digest summary for this admin
        const summary = await getDigestSummary(admin.userId);
        
        // Generate email HTML
        const emailHtml = generateDigestHTML(admin.name || "Admin", summary);
        
        // Send email
        const emailSent = await sendEmail({
          to: admin.email || "",
          subject: `Daily Digest - ${new Date().toLocaleDateString()}`,
          html: emailHtml,
        });

        // Record in history
        if (emailSent) {
          await recordDigestHistory(admin.userId, {
            leadsCount: summary.leadsCount,
            ticketsCount: summary.ticketsCount,
            approvalsCount: summary.approvalsCount,
            status: "sent",
          } as any);
          
          // Update last sent timestamp
          await updateDigestPreferencesLastSent(admin.userId);
          
          console.log(`[Email Digest] Digest sent successfully to ${admin.email}`);
        } else {
          await recordDigestHistory(admin.userId, {
            leadsCount: summary.leadsCount,
            ticketsCount: summary.ticketsCount,
            approvalsCount: summary.approvalsCount,
            status: "failed",
            errorMessage: "Failed to send email",
          } as any);
          
          console.error(`[Email Digest] Failed to send digest to ${admin.email}`);
        }
      } catch (error) {
        console.error(`[Email Digest] Error processing digest for admin ${admin.userId}:`, error);
        
        try {
          await recordDigestHistory(admin.userId, {
            leadsCount: 0,
            ticketsCount: 0,
            approvalsCount: 0,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          } as any);
        } catch (_) {
          // Ignore error recording failures
        }
      }
    }

    console.log("[Email Digest] Digest generation completed");
  } catch (error) {
    console.error("[Email Digest] Fatal error during digest generation:", error);
  }
}

function generateDigestHTML(adminName: string, summary: { leadsCount: number; ticketsCount: number; approvalsCount: number }): string {
  const date = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #0A0E1A 0%, #1a1f3a 100%);
      color: #00D4FF;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #00D4FF;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #0A0E1A;
      margin: 10px 0;
    }
    .metric-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #0A0E1A;
      margin-bottom: 10px;
      border-bottom: 2px solid #00D4FF;
      padding-bottom: 8px;
    }
    .section-content {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
    }
    .cta-button {
      display: inline-block;
      background: #00D4FF;
      color: #0A0E1A;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GigitekAI Daily Digest</h1>
    <p>${date}</p>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="metric-label">New Leads</div>
      <div class="metric-value">${summary.leadsCount}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Open Tickets</div>
      <div class="metric-value">${summary.ticketsCount}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Pending Approvals</div>
      <div class="metric-value">${summary.approvalsCount}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📊 Summary</div>
    <div class="section-content">
      <p>Hello ${adminName},</p>
      <p>Here's your daily summary of GigitekAI activity:</p>
      <ul>
        <li><strong>${summary.leadsCount}</strong> new lead${summary.leadsCount !== 1 ? "s" : ""} from chat conversations</li>
        <li><strong>${summary.ticketsCount}</strong> open or in-progress support ticket${summary.ticketsCount !== 1 ? "s" : ""}</li>
        <li><strong>${summary.approvalsCount}</strong> pending user approval${summary.approvalsCount !== 1 ? "s" : ""}</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🚀 Quick Actions</div>
    <div class="section-content">
      <p>
        <a href="https://gigitekai.com/admin/panel" class="cta-button">View Admin Panel</a>
      </p>
      <p>
        <a href="https://gigitekai.com/helpdesk" class="cta-button">View Help Desk</a>
      </p>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated digest from GigitekAI. You can manage your digest preferences in your admin settings.</p>
    <p>&copy; ${new Date().getFullYear()} GigitekAI. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}
