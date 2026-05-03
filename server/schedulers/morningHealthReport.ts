/**
 * Morning Health Report
 * Called daily at 6 AM by the Manus scheduled task.
 * Checks all key public pages and sends a status email to support@gigitekai.com.
 */
import { sendEmail } from "../_core/email";

const SITE_BASE = "https://gigitekai.com";

const KEY_PAGES = [
  { name: "Homepage", path: "/" },
  { name: "Services", path: "/services" },
  { name: "Microsoft Copilot", path: "/services/microsoft-copilot" },
  { name: "AI-Powered MSP", path: "/ai-powered-msp" },
  { name: "Managed IT Tampa", path: "/managed-it-services-tampa" },
  { name: "Managed IT Miami", path: "/managed-it-services-miami" },
  { name: "Helpdesk Pricing", path: "/helpdesk-pricing" },
  { name: "ROI Calculator", path: "/roi-calculator" },
  { name: "AI Work Live Demo", path: "/ai-demo" },
  { name: "Blog / Insights", path: "/blog" },
  { name: "About Us", path: "/about-us" },
  { name: "Contact", path: "/contact" },
  { name: "Privacy Policy", path: "/privacy-policy" },
  { name: "Sitemap", path: "/sitemap.xml" },
];

interface PageResult {
  name: string;
  url: string;
  status: number | null;
  responseTimeMs: number;
  ok: boolean;
  error?: string;
}

async function checkPage(name: string, path: string): Promise<PageResult> {
  const url = `${SITE_BASE}${path}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "GigitekAI-HealthBot/1.0" },
    });
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - start;
    return {
      name,
      url,
      status: res.status,
      responseTimeMs,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err: unknown) {
    return {
      name,
      url,
      status: null,
      responseTimeMs: Date.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function buildEmailHtml(results: PageResult[], timestamp: string): string {
  const allOk = results.every((r) => r.ok);
  const failCount = results.filter((r) => !r.ok).length;
  const avgResponseMs = Math.round(
    results.reduce((sum, r) => sum + r.responseTimeMs, 0) / results.length
  );

  const statusBadge = allOk
    ? `<span style="background:#00D4FF;color:#0A0E1A;padding:4px 12px;border-radius:4px;font-weight:bold;">✅ ALL SYSTEMS OPERATIONAL</span>`
    : `<span style="background:#FF4444;color:#fff;padding:4px 12px;border-radius:4px;font-weight:bold;">⚠️ ${failCount} PAGE(S) DOWN</span>`;

  const rows = results
    .map((r) => {
      const icon = r.ok ? "✅" : "❌";
      const statusText = r.status ? `HTTP ${r.status}` : `ERROR: ${r.error ?? "Timeout"}`;
      const rowBg = r.ok ? "#0d1a2a" : "#2a0d0d";
      return `
      <tr style="background:${rowBg};">
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a3a;">${icon} ${r.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a3a;color:#888;font-size:12px;">${r.url}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a3a;text-align:center;">${statusText}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a3a;text-align:right;color:#00D4FF;">${r.responseTimeMs}ms</td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:'Segoe UI',Arial,sans-serif;color:#e0e0e0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;">
    <tr>
      <td style="padding:32px 24px 16px;">
        <img src="https://d36hbw14aib5lz.cloudfront.net/manus-storage/gigitekai-logo-small_1746321861.webp" alt="GigitekAI" height="40" style="display:block;margin-bottom:16px;" />
        <h1 style="margin:0 0 8px;font-size:22px;color:#fff;">Daily Site Health Report</h1>
        <p style="margin:0;color:#888;font-size:13px;">${timestamp} ET</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 24px 24px;">
        <p style="margin:0 0 16px;">${statusBadge}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#aaa;">
          <strong style="color:#fff;">${results.length}</strong> pages checked &nbsp;·&nbsp;
          <strong style="color:#fff;">${results.filter((r) => r.ok).length}</strong> passing &nbsp;·&nbsp;
          <strong style="color:${failCount > 0 ? "#FF4444" : "#00D4FF"};">${failCount}</strong> failing &nbsp;·&nbsp;
          Avg response: <strong style="color:#00D4FF;">${avgResponseMs}ms</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #1a2a3a;">
          <thead>
            <tr style="background:#0d1a2a;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#00D4FF;text-transform:uppercase;letter-spacing:1px;">Page</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#00D4FF;text-transform:uppercase;letter-spacing:1px;">URL</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#00D4FF;text-transform:uppercase;letter-spacing:1px;">Status</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#00D4FF;text-transform:uppercase;letter-spacing:1px;">Response</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 24px 32px;border-top:1px solid #1a2a3a;">
        <p style="margin:16px 0 0;font-size:12px;color:#555;">
          This is an automated report from the GigitekAI site health monitor.<br>
          To manage alerts, contact <a href="mailto:support@gigitekai.com" style="color:#00D4FF;">support@gigitekai.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function runMorningHealthReport(): Promise<{ ok: boolean; failCount: number }> {
  console.log("[MorningHealthReport] Starting daily health check...");

  const results = await Promise.all(
    KEY_PAGES.map((p) => checkPage(p.name, p.path))
  );

  const failCount = results.filter((r) => !r.ok).length;
  const allOk = failCount === 0;

  const now = new Date();
  const timestamp = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = allOk
    ? `✅ GigitekAI Site Health — All Systems Operational (${now.toLocaleDateString("en-US", { timeZone: "America/New_York" })})`
    : `⚠️ GigitekAI Site Health — ${failCount} Issue(s) Detected (${now.toLocaleDateString("en-US", { timeZone: "America/New_York" })})`;

  const html = buildEmailHtml(results, timestamp);

  await sendEmail({
    to: "support@gigitekai.com",
    subject,
    html,
    fromName: "GigitekAI Health Monitor",
  });

  console.log(`[MorningHealthReport] Report sent. ${failCount} failures detected.`);
  return { ok: allOk, failCount };
}
