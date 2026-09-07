export type KbAuditTrendSource = {
  periodKey: string;
  status: string;
  publishedArticles: number;
  copilotArticles: number;
  staleArticles: number;
  checkedReferences: number;
  brokenReferences: number;
  blockedReferences: number;
  duplicateGroups: number;
};

export function buildKbAuditTrendData(history: KbAuditTrendSource[]) {
  return history
    .filter(item => item.status === "completed")
    .slice()
    .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
    .map(item => ({
      period: item.periodKey,
      published: item.publishedArticles,
      copilot: item.copilotArticles,
      stale: item.staleArticles,
      checked: item.checkedReferences,
      broken: item.brokenReferences,
      blocked: item.blockedReferences,
      duplicates: item.duplicateGroups,
    }));
}
