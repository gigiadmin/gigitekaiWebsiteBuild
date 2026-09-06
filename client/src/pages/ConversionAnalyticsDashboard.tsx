import { Activity, ArrowLeft, MousePointerClick, RefreshCw, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";

export default function ConversionAnalyticsDashboard() {
  const query = trpc.websiteExpansion.getConversionAnalytics.useQuery({ days: 30 }, { refetchInterval: 60_000 });
  const totals = query.data?.totals ?? [];
  const maxCount = Math.max(1, ...totals.map((item) => Number(item.count)));
  return (
    <AdminLayout title="Conversion Analytics">
    <div className="min-h-screen bg-[#070B14] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><a href="/admin" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#00D4FF]"><ArrowLeft className="h-4 w-4" />Admin portal</a><p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-[#00D4FF]">Conversion Analytics</p><h1 className="mt-3 text-4xl font-semibold">Public-site conversion signals</h1><p className="mt-3 max-w-2xl text-slate-400">Real first-party events from the previous 30 days. No simulated metrics are displayed.</p></div>
          <button onClick={() => query.refetch()} className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-4 text-sm font-semibold"><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</button>
        </div>

        {query.error ? <div className="mt-8 border border-red-400/30 bg-red-400/5 p-5 text-red-200">{query.error.message}</div> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Metric icon={Activity} label="Event types" value={String(totals.length)} />
          <Metric icon={MousePointerClick} label="Total tracked events" value={String(totals.reduce((sum, item) => sum + Number(item.count), 0))} />
          <Metric icon={Target} label="Recent event records" value={String(query.data?.recent.length ?? 0)} />
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border border-white/10 bg-[#0A1020] p-6"><h2 className="text-xl font-semibold">Event mix</h2><div className="mt-6 space-y-5">{totals.length ? totals.map((item) => <div key={item.eventName}><div className="flex justify-between gap-4 text-sm"><span>{item.eventName.replaceAll("_", " ")}</span><span className="text-[#00D4FF]">{Number(item.count)}</span></div><div className="mt-2 h-2 bg-white/5"><div className="h-full bg-[#00D4FF]" style={{ width: `${(Number(item.count) / maxCount) * 100}%` }} /></div></div>) : <p className="text-sm text-slate-400">No conversion events have been recorded yet.</p>}</div></div>
          <div className="overflow-hidden border border-white/10 bg-[#0A1020]"><div className="border-b border-white/10 p-6"><h2 className="text-xl font-semibold">Recent events</h2></div><div className="max-h-[34rem] overflow-auto divide-y divide-white/10">{query.data?.recent.map((event) => <article key={event.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto]"><div><p className="font-semibold">{event.eventName.replaceAll("_", " ")}</p><p className="mt-1 text-sm text-slate-400">{event.pageUrl}{event.elementId ? ` · ${event.elementId}` : ""}</p></div><time className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</time></article>)}</div></div>
        </section>
      </div>
    </div>
    </AdminLayout>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return <div className="border border-white/10 bg-[#0A1020] p-6"><Icon className="h-5 w-5 text-[#00D4FF]" /><p className="mt-6 text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}
