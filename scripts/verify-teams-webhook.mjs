const rawUrl = process.env.TEAMS_WEBHOOK_URL || "";
const queryIndex = rawUrl.indexOf("?");
const webhookUrl = queryIndex < 0
  ? rawUrl
  : `${rawUrl.slice(0, queryIndex)}?${rawUrl
      .slice(queryIndex + 1)
      .replace(/\\u0026/gi, "&")
      .replace(/&amp;/gi, "&")
      .replace(/%26/gi, "&")}`;

if (!webhookUrl) {
  console.error("TEAMS_WEBHOOK_URL is not configured");
  process.exit(1);
}

const response = await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "GigitekAI launch-readiness verification",
    text: "Teams webhook delivery was verified during launch QA. This is a test notification and contains no client data.",
    themeColor: "00D4FF",
  }),
});

const body = await response.text();
console.log(JSON.stringify({ status: response.status, ok: response.ok, response: body.slice(0, 500) }));
process.exit(response.ok ? 0 : 1);
