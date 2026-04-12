import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const siteUrl = "https://gigitekai.com";
const token = "test-token-123";
const unsubUrl = `${siteUrl}/unsubscribe?token=${token}`;

const welcomeHtml = [
  "<!DOCTYPE html>",
  "<html lang='en'>",
  "<head><meta charset='utf-8'/><title>Welcome to GigitekAI Insights</title>",
  "<style>",
  "body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;}",
  ".wrapper{max-width:640px;margin:32px auto;background:#ffffff;border-radius:10px;overflow:hidden;}",
  ".header{background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);padding:28px 32px;border-bottom:3px solid #00D4FF;}",
  ".logo-text{color:#00D4FF;font-size:22px;font-weight:700;}",
  ".content{padding:32px;color:#1a202c;font-size:15px;line-height:1.7;}",
  ".cta-btn{display:inline-block;background:#00D4FF;color:#0A0E1A;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;margin-top:16px;}",
  ".footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;font-size:12px;color:#718096;}",
  "</style></head>",
  "<body>",
  "<div class='wrapper'>",
  "<div class='header'><div class='logo-text'>GigitekAI</div><div style='color:#8899AA;font-size:12px;'>Cloud &amp; AI Solutions</div></div>",
  "<div class='content'>",
  "<h1 style='color:#0A0E1A;font-weight:700;margin-top:0;'>Welcome to GigitekAI Insights!</h1>",
  "<p>Thank you for subscribing. You're now part of the GigitekAI community — where IT professionals and business leaders stay ahead of the curve on AI, cloud infrastructure, and cybersecurity.</p>",
  "<p><strong>What to expect:</strong></p>",
  "<ul>",
  "<li>Actionable insights on Microsoft 365, AI automation, and managed services</li>",
  "<li>Cloud strategy and cybersecurity best practices</li>",
  "<li>GigitekAI news, product updates, and exclusive content</li>",
  "</ul>",
  `<a href="${siteUrl}/blog" class='cta-btn'>Read Our Blog &rarr;</a>`,
  `<p style='margin-top:24px;'>Questions? <a href='mailto:support@gigitekai.com' style='color:#00D4FF;'>support@gigitekai.com</a></p>`,
  "</div>",
  "<div class='footer'>",
  `<p style='margin:0 0 6px;'>GigitekAI &bull; Cloud &amp; AI Solutions &bull; <a href='${siteUrl}'>gigitekai.com</a></p>`,
  `<p style='margin:0;'>You're receiving this because you subscribed at gigitekai.com. &nbsp;<a href='${unsubUrl}'>Unsubscribe</a></p>`,
  "</div>",
  "</div>",
  "</body></html>",
].join("\n");

const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: "support@gigitekai.com" }] }],
    from: { email: "support@gigitekai.com", name: "GigitekAI" },
    reply_to: { email: "support@gigitekai.com" },
    subject: "Welcome to GigitekAI Insights! (Live Test)",
    content: [{ type: "text/html", value: welcomeHtml }],
  }),
});

console.log("SendGrid status:", response.status);
if (response.status === 202) {
  console.log("✅ Welcome email sent successfully to support@gigitekai.com!");
  console.log("   From: support@gigitekai.com");
  console.log("   Reply-To: support@gigitekai.com");
} else {
  const body = await response.text();
  console.error("❌ Failed:", body);
}
