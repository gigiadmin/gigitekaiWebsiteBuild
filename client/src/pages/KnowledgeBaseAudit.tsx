import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, FileWarning, Link2, Loader2, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { buildKbAuditTrendData } from "@/lib/kbAuditTrends";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AuditFindings = {
  stale?: Array<{ id: number; title: string; updatedAt: string; ageDays: number }>;
  duplicates?: Array<{ firstId: number; firstTitle: string; secondId: number; secondTitle: string; similarity: number }>;
  links?: Array<{ url: string; status: number | null; state: "broken" | "blocked" | "unreachable" }>;
  omittedReferenceCount?: number;
};

function asFindings(value: unknown): AuditFindings {
  return value && typeof value === "object" ? value as AuditFindings : {};
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not completed";
  return new Date(value).toLocaleString();
}

function AuditTrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-white/10 bg-slate-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} className="mt-1" style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

export default function KnowledgeBaseAudit() {
  const utils = trpc.useUtils();
  const historyQuery = trpc.websiteExpansion.getKbAuditHistory.useQuery({ limit: 12 });
  const runAudit = trpc.websiteExpansion.runKbAuditNow.useMutation({
    onSuccess: result => {
      toast.success(result.skipped ? "This month’s audit was already completed." : "Knowledge Base audit completed.");
      utils.websiteExpansion.getKbAuditHistory.invalidate();
    },
    onError: error => toast.error(error.message || "Knowledge Base audit failed"),
  });

  const history = historyQuery.data ?? [];
  const latest = history[0];
  const findings = useMemo(() => asFindings(latest?.findings), [latest?.findings]);
  const trendData = useMemo(() => buildKbAuditTrendData(history), [history]);
  const healthy = latest?.status === "completed" && (latest.brokenReferences ?? 0) === 0 && (latest.duplicateGroups ?? 0) === 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">Content operations</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Knowledge Base Quality Audit</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Monthly deterministic checks for publication health, aging content, potential duplicate titles, Aria availability, and reference-link integrity. Audits never delete or rewrite articles.</p>
          </div>
          <Button onClick={() => runAudit.mutate()} disabled={runAudit.isPending} className="min-h-[44px] bg-cyan-500 text-slate-950 hover:bg-cyan-300">
            {runAudit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Run this month’s audit
          </Button>
        </header>

        {historyQuery.isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
        ) : latest ? (
          <>
            <section className={`border p-5 ${healthy ? "border-emerald-400/30 bg-emerald-400/[0.06]" : "border-amber-400/30 bg-amber-400/[0.06]"}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {healthy ? <CheckCircle2 className="h-7 w-7 text-emerald-400" /> : <AlertTriangle className="h-7 w-7 text-amber-400" />}
                  <div>
                    <h2 className="font-semibold text-white">{healthy ? "Latest audit is healthy" : "Latest audit has findings to review"}</h2>
                    <p className="mt-1 text-sm text-slate-400">Period {latest.periodKey} · Completed {formatDate(latest.completedAt)}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Source: {latest.source}</span>
              </div>
            </section>

            <section className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Published", latest.publishedArticles, "articles available publicly"],
                ["Copilot", latest.copilotArticles, "validated collection articles"],
                ["References", latest.checkedReferences, "unique URLs checked"],
                ["Broken", latest.brokenReferences, "404 or 410 responses"],
                ["Blocked", latest.blockedReferences, "blocked or unreachable checks"],
                ["Aging", latest.staleArticles, "older than 365 days"],
                ["Duplicate risk", latest.duplicateGroups, "potential title pairs"],
                ["Aria disabled", latest.ariaDisabledArticles, "published articles unavailable to Aria"],
              ].map(([label, value, description]) => (
                <div key={String(label)} className="bg-slate-950 p-5">
                  <p className="text-3xl font-bold text-cyan-300">{value}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{label}</p>
                  <p className="mt-1 text-xs text-slate-500">{description}</p>
                </div>
              ))}
            </section>

            <section className="border border-white/10 bg-slate-950 p-5" aria-labelledby="audit-trends-title">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="audit-trends-title" className="font-semibold text-white">Historical audit trends</h2>
                  <p className="mt-1 text-sm text-slate-400">Actual persisted monthly audit values only; no estimated or backfilled history.</p>
                </div>
                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">{trendData.length} completed run{trendData.length === 1 ? "" : "s"}</span>
              </div>

              {trendData.length === 1 && (
                <div className="mt-5 border border-cyan-400/20 bg-cyan-400/[0.05] px-4 py-3 text-sm text-slate-300">
                  September is the current baseline. Trend lines will grow automatically as future monthly audits are persisted.
                </div>
              )}

              <div className="mt-6 grid gap-8 xl:grid-cols-2">
                <figure className="min-w-0" aria-label="Knowledge Base publication trend chart">
                  <figcaption className="mb-3 text-sm font-medium text-slate-200">Published coverage</figcaption>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 12, left: -18, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                        <XAxis dataKey="period" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                        <Tooltip content={<AuditTrendTooltip />} />
                        <Legend wrapperStyle={{ color: "#CBD5E1", fontSize: 11, paddingTop: 8 }} />
                        <Line type="linear" dataKey="published" name="Published" stroke="#22D3EE" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="linear" dataKey="copilot" name="Copilot" stroke="#818CF8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="linear" dataKey="stale" name="Aging" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </figure>

                <figure className="min-w-0" aria-label="Knowledge Base quality findings trend chart">
                  <figcaption className="mb-3 text-sm font-medium text-slate-200">Reference and duplicate findings</figcaption>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 12, left: -18, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                        <XAxis dataKey="period" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                        <Tooltip content={<AuditTrendTooltip />} />
                        <Legend wrapperStyle={{ color: "#CBD5E1", fontSize: 11, paddingTop: 8 }} />
                        <Line type="linear" dataKey="broken" name="Broken" stroke="#FB7185" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="linear" dataKey="blocked" name="Blocked" stroke="#FBBF24" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="linear" dataKey="duplicates" name="Duplicate risk" stroke="#A78BFA" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </figure>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-cyan-400" /><h2 className="font-semibold text-white">Reference findings</h2></div>
                <div className="mt-4 space-y-3">
                  {(findings.links ?? []).slice(0, 20).map(item => (
                    <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="block border-t border-white/5 pt-3 text-sm text-slate-300 hover:text-cyan-300">
                      <span className="line-clamp-2 break-all">{item.url}</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">{item.state} · {item.status ?? "no response"} <ExternalLink className="h-3 w-3" /></span>
                    </a>
                  ))}
                  {!(findings.links ?? []).length && <p className="text-sm text-slate-500">No reference findings.</p>}
                </div>
              </div>

              <div className="border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center gap-2"><FileWarning className="h-5 w-5 text-cyan-400" /><h2 className="font-semibold text-white">Aging content</h2></div>
                <div className="mt-4 space-y-3">
                  {(findings.stale ?? []).slice(0, 20).map(item => (
                    <a key={item.id} href={`/kb/${item.id}`} className="block border-t border-white/5 pt-3 text-sm text-slate-300 hover:text-cyan-300">
                      <span className="line-clamp-2">{item.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{item.ageDays} days since update</span>
                    </a>
                  ))}
                  {!(findings.stale ?? []).length && <p className="text-sm text-slate-500">No articles exceed the 365-day review threshold.</p>}
                </div>
              </div>

              <div className="border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-cyan-400" /><h2 className="font-semibold text-white">Potential overlap</h2></div>
                <div className="mt-4 space-y-3">
                  {(findings.duplicates ?? []).slice(0, 20).map(item => (
                    <div key={`${item.firstId}-${item.secondId}`} className="border-t border-white/5 pt-3 text-sm text-slate-300">
                      <p>{item.firstTitle}</p><p className="mt-1 text-slate-500">compared with</p><p className="mt-1">{item.secondTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">Similarity {Math.round(item.similarity * 100)}%</p>
                    </div>
                  ))}
                  {!(findings.duplicates ?? []).length && <p className="text-sm text-slate-500">No high-confidence title overlap detected.</p>}
                </div>
              </div>
            </section>

            <section className="border border-white/10 bg-slate-950 p-5">
              <h2 className="font-semibold text-white">Audit history</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-500"><tr><th className="py-3">Period</th><th>Status</th><th>Published</th><th>References</th><th>Broken</th><th>Aging</th><th>Duplicates</th><th>Completed</th></tr></thead>
                  <tbody>{history.map(item => <tr key={item.id} className="border-b border-white/5 text-slate-300"><td className="py-3 font-medium text-white">{item.periodKey}</td><td>{item.status}</td><td>{item.publishedArticles}</td><td>{item.checkedReferences}</td><td>{item.brokenReferences}</td><td>{item.staleArticles}</td><td>{item.duplicateGroups}</td><td>{formatDate(item.completedAt)}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <div className="border border-white/10 bg-slate-950 px-6 py-14 text-center">
            <FileWarning className="mx-auto h-8 w-8 text-cyan-400" />
            <h2 className="mt-4 text-lg font-semibold text-white">No audit has run yet</h2>
            <p className="mt-2 text-sm text-slate-400">Run the first audit now or wait for the monthly scheduled execution.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
