import { buildAdminSessionCookieHeader, findAdminByEmail, signAdminToken } from "../server/admin-auth.ts";

const baseUrl = process.env.KB_VALIDATION_BASE_URL || "http://127.0.0.1:3000";
const configuredEmails = (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map(value => value.trim().toLowerCase())
  .filter(Boolean);

let admin = null;
for (const email of configuredEmails) {
  const candidate = await findAdminByEmail(email);
  if (candidate?.isActive) {
    admin = candidate;
    break;
  }
}
if (!admin) throw new Error("No active configured administrator is available for authenticated validation");

const token = await signAdminToken({
  adminId: admin.id,
  email: admin.email,
  name: admin.name,
  role: admin.role,
});
const cookie = buildAdminSessionCookieHeader(token, false).split(";")[0];
const input = encodeURIComponent(JSON.stringify({ json: { limit: 12 } }));
const response = await fetch(`${baseUrl}/api/trpc/websiteExpansion.getKbAuditHistory?input=${input}`, {
  headers: { cookie },
});
const payload = await response.json();
if (!response.ok) throw new Error(`Authenticated audit-history validation failed with HTTP ${response.status}`);

const history = payload?.result?.data?.json ?? [];
const latest = history[0];
console.log(JSON.stringify({
  authenticated: true,
  httpStatus: response.status,
  historyCount: history.length,
  latest: latest ? {
    periodKey: latest.periodKey,
    status: latest.status,
    publishedArticles: latest.publishedArticles,
    copilotArticles: latest.copilotArticles,
    checkedReferences: latest.checkedReferences,
    brokenReferences: latest.brokenReferences,
    blockedReferences: latest.blockedReferences,
    staleArticles: latest.staleArticles,
    duplicateGroups: latest.duplicateGroups,
  } : null,
}, null, 2));
process.exit(0);
