import { CheckCircle2, Circle, Clock3, ExternalLink, LockKeyhole } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function ClientOnboardingPortal() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.clientOnboarding.getMyPortal.useQuery(undefined, { enabled: isAuthenticated });
  const update = trpc.clientOnboarding.updateMyTask.useMutation({ onSuccess: () => utils.clientOnboarding.getMyPortal.invalidate() });

  if (loading) return <PortalStatus message="Checking secure access…" />;
  if (!isAuthenticated) return <PortalStatus message="Sign in with the email address assigned to your GigitekAI client profile." actionLabel="Sign in securely" actionHref={getLoginUrl("/client/onboarding")} />;
  if (query.isLoading) return <PortalStatus message="Loading your onboarding workspace…" />;
  if (query.error) return <PortalStatus message={query.error.message} />;
  if (!query.data) return <PortalStatus message="No onboarding workspace is assigned to this account yet. Contact support@gigitekai.com or 609-676-4483 for assistance." actionLabel="Contact support" actionHref="/support" />;

  const { client, tasks, timeline } = query.data;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  return (
    <div className="min-h-screen bg-[#070B14] text-white"><SiteNavBar2024 /><main className="mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-8 lg:px-12"><div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]"><section><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#00D4FF]">Secure Client Onboarding</p><h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Welcome, {client.contactFirstName}.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Track the onboarding work for {client.companyName}. Never place passwords, secret keys, recovery codes, or sensitive personal data in task notes.</p><div className="mt-8 border border-white/10 bg-[#0A1020] p-6"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">Onboarding progress</span><span className="font-semibold text-[#00D4FF]">{progress}%</span></div><div className="mt-3 h-2 bg-white/5"><div className="h-full bg-[#00D4FF]" style={{ width: `${progress}%` }} /></div><div className="mt-8 divide-y divide-white/10">{tasks.map((task) => <article key={task.id} className="grid gap-4 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">{task.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : task.status === "in_progress" ? <Clock3 className="h-5 w-5 text-amber-300" /> : <Circle className="h-5 w-5 text-slate-500" />}<div><p className="text-xs uppercase tracking-[0.14em] text-slate-500">{task.category}</p><h2 className="mt-1 font-semibold">{task.title}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{task.description}</p></div><select value={task.status} disabled={update.isPending} onChange={(event) => update.mutate({ taskId: task.id, status: event.target.value as "pending" | "in_progress" | "completed" })} className="min-h-11 border border-white/15 bg-[#070B14] px-3 text-sm"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></article>)}</div></div></section><aside className="space-y-6"><div className="border border-[#00D4FF]/25 bg-[#00D4FF]/5 p-6"><LockKeyhole className="h-6 w-6 text-[#00D4FF]" /><h2 className="mt-5 text-xl font-semibold">Engagement status</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Service</dt><dd className="mt-1">{client.serviceType}</dd></div><div><dt className="text-slate-500">Current step</dt><dd className="mt-1 capitalize">{client.onboardingStep.replaceAll("_", " ")}</dd></div><div><dt className="text-slate-500">Overall status</dt><dd className="mt-1 capitalize">{client.status}</dd></div></dl></div><div className="border border-white/10 bg-[#0A1020] p-6"><h2 className="text-xl font-semibold">Recent activity</h2><div className="mt-5 space-y-5">{timeline.map((event) => <div key={event.id} className="border-l border-white/15 pl-4"><p className="text-sm text-slate-200">{event.description}</p><time className="mt-1 block text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</time></div>)}</div></div><a href="/support" className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-white/15 px-4 font-semibold hover:border-[#00D4FF]">Open support <ExternalLink className="h-4 w-4" /></a></aside></div></main><Footer /></div>
  );
}

function PortalStatus({ message, actionLabel, actionHref }: { message: string; actionLabel?: string; actionHref?: string }) {
  return <div className="min-h-screen bg-[#070B14] px-5 py-24 text-white"><div className="mx-auto max-w-xl border border-white/10 bg-[#0A1020] p-8 text-center"><LockKeyhole className="mx-auto h-8 w-8 text-[#00D4FF]" /><p className="mt-6 leading-7 text-slate-300">{message}</p>{actionLabel && actionHref ? <a href={actionHref} className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#00D4FF] px-6 font-bold text-[#07101A]">{actionLabel}</a> : null}</div></div>;
}
