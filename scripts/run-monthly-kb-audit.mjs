import { runMonthlyKbQualityAudit } from "../server/services/kbQualityAudit";

const result = await runMonthlyKbQualityAudit({ source: "manual" });
const audit = result.audit;
console.log(JSON.stringify({
  skipped: result.skipped,
  reason: "reason" in result ? result.reason : undefined,
  id: audit?.id,
  periodKey: audit?.periodKey,
  status: audit?.status,
  totalArticles: audit?.totalArticles,
  publishedArticles: audit?.publishedArticles,
  copilotArticles: audit?.copilotArticles,
  checkedReferences: audit?.checkedReferences,
  brokenReferences: audit?.brokenReferences,
  blockedReferences: audit?.blockedReferences,
  staleArticles: audit?.staleArticles,
  duplicateGroups: audit?.duplicateGroups,
}));
