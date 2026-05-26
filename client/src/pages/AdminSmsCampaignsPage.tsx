/**
 * AdminSmsCampaignsPage — SMS Campaign Management Dashboard
 * Full TCPA-compliant SMS campaign management:
 * - Overview metrics (contacts, delivery rate, opt-outs)
 * - Contact management (add, import, opt-out, delete)
 * - Campaign creation and send
 * - Message delivery tracking
 * - Opt-out compliance log
 */

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  MessageSquare,
  Users,
  Send,
  TrendingUp,
  Plus,
  Trash2,
  UserX,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Building2,
  Mail,
  FileText,
  ChevronRight,
  Zap,
  BarChart3,
  ShieldCheck,
  Download,
  Upload,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "contacts" | "campaigns" | "optouts";

type SmsContact = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  source: string;
  optedIn: boolean;
  optedInAt: Date;
  optedOutAt: Date | null;
  createdAt: Date;
};

type SmsCampaign = {
  id: number;
  name: string;
  description: string | null;
  message: string;
  status: string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOptedOut: number;
  createdAt: Date;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    sending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    sent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    paused: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>
      {status}
    </span>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-[#0D1526] border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/5`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminSmsCampaignsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showTestSms, setShowTestSms] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState<number | null>(null);
  const [includeOptedOut, setIncludeOptedOut] = useState(false);

  // ── Queries ──
  const metricsQ = trpc.smsCampaign.getMetrics.useQuery();
  const contactsQ = trpc.smsCampaign.listContacts.useQuery({ includeOptedOut });
  const campaignsQ = trpc.smsCampaign.listCampaigns.useQuery();
  const optOutsQ = trpc.smsCampaign.getOptOuts.useQuery();

  const utils = trpc.useUtils();
  const refetchAll = () => {
    utils.smsCampaign.getMetrics.invalidate();
    utils.smsCampaign.listContacts.invalidate();
    utils.smsCampaign.listCampaigns.invalidate();
    utils.smsCampaign.getOptOuts.invalidate();
  };

  // ── Mutations ──
  const addContact = trpc.smsCampaign.addContact.useMutation({
    onSuccess: () => { toast.success("Contact added"); setShowAddContact(false); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const optOut = trpc.smsCampaign.optOutContact.useMutation({
    onSuccess: () => { toast.success("Contact opted out"); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteContact = trpc.smsCampaign.deleteContact.useMutation({
    onSuccess: () => { toast.success("Contact deleted"); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const createCampaign = trpc.smsCampaign.createCampaign.useMutation({
    onSuccess: () => { toast.success("Campaign created"); setShowCreateCampaign(false); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const sendCampaign = trpc.smsCampaign.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(`Sent ${data.sent} messages (${data.failed} failed)`);
      setShowSendConfirm(null);
      refetchAll();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteCampaign = trpc.smsCampaign.deleteCampaign.useMutation({
    onSuccess: () => { toast.success("Campaign deleted"); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const sendTest = trpc.smsCampaign.sendTestSms.useMutation({
    onSuccess: () => { toast.success("Test SMS sent!"); setShowTestSms(false); },
    onError: (e) => toast.error(e.message),
  });

  // ── Form state ──
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", company: "" });
  const [campaignForm, setCampaignForm] = useState({ name: "", description: "", message: "" });
  const [testForm, setTestForm] = useState({ to: "", message: "Hi {{name}}, this is a test from GigitekAI. Reply STOP to opt out." });

  const metrics = metricsQ.data;
  const contacts = (contactsQ.data?.contacts ?? []) as unknown as SmsContact[];
  const campaigns = (campaignsQ.data?.campaigns ?? []) as unknown as SmsCampaign[];
  const optOuts = optOutsQ.data?.optOuts ?? [];

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "campaigns", label: "Campaigns", icon: MessageSquare },
    { id: "optouts", label: "Opt-Out Log", icon: ShieldCheck },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#0A0E1A] text-white">
        {/* ── Header ── */}
        <div className="border-b border-white/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SMS Campaigns</h1>
                <p className="text-xs text-slate-400">Azure ACS · Twilio · TCPA Compliant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {metrics?.twilioConfigured ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Twilio Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Twilio Not Configured
                </span>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowTestSms(true)}
                className="border-white/10 text-slate-300 hover:bg-white/5 text-xs">
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Test SMS
              </Button>
              <Button size="sm" onClick={() => setShowCreateCampaign(true)}
                className="bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Campaign
              </Button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 mt-5">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-[opacity,transform] ${
                  tab === t.id
                    ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={Users} label="Total Contacts" value={metrics?.contacts.total ?? 0}
                  sub={`${metrics?.contacts.optedIn ?? 0} opted in`} color="text-[#00D4FF]" />
                <MetricCard icon={UserX} label="Opted Out" value={metrics?.contacts.optedOut ?? 0}
                  sub="TCPA compliance" color="text-amber-400" />
                <MetricCard icon={Send} label="Messages Sent" value={metrics?.messages.total ?? 0}
                  sub={`${metrics?.messages.failed ?? 0} failed`} color="text-emerald-400" />
                <MetricCard icon={TrendingUp} label="Delivery Rate" value={`${metrics?.deliveryRate ?? 0}%`}
                  sub="sent + delivered" color="text-violet-400" />
              </div>

              {/* Recent Campaigns */}
              <div className="bg-[#0D1526] border border-white/5 rounded-xl">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="font-semibold text-white text-sm">Recent Campaigns</h2>
                  <button onClick={() => setTab("campaigns")} className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {(metrics?.recentCampaigns ?? []).length === 0 ? (
                    <div className="px-5 py-8 text-center text-slate-500 text-sm">No campaigns yet. Create your first one above.</div>
                  ) : (
                    (metrics?.recentCampaigns ?? []).map((c: any) => (
                      <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          <p className="text-xs text-slate-500">{fmt(c.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{c.totalSent}/{c.totalRecipients} sent</span>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Compliance Notice */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">TCPA Compliance Active</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All messages include STOP opt-out instructions. Opt-outs are logged and honored automatically.
                    Azure ACS approval: ✅ Complete. Privacy Policy Section 10: ✅ Updated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTACTS TAB ── */}
          {tab === "contacts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{contactsQ.data?.optedIn ?? 0} opted-in contacts</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={includeOptedOut} onChange={e => setIncludeOptedOut(e.target.checked)}
                      className="rounded" />
                    Show opted-out
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => refetchAll()}
                    className="border-white/10 text-slate-300 hover:bg-white/5 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                  </Button>
                  <Button size="sm" onClick={() => setShowAddContact(true)}
                    className="bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Contact
                  </Button>
                </div>
              </div>

              <div className="bg-[#0D1526] border border-white/5 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs">Name</TableHead>
                      <TableHead className="text-slate-400 text-xs">Phone</TableHead>
                      <TableHead className="text-slate-400 text-xs">Company</TableHead>
                      <TableHead className="text-slate-400 text-xs">Source</TableHead>
                      <TableHead className="text-slate-400 text-xs">Status</TableHead>
                      <TableHead className="text-slate-400 text-xs">Added</TableHead>
                      <TableHead className="text-slate-400 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500 py-10 text-sm">
                          No contacts yet. Add your first opted-in contact above.
                        </TableCell>
                      </TableRow>
                    ) : contacts.map(c => (
                      <TableRow key={c.id} className="border-white/5 hover:bg-white/2">
                        <TableCell className="text-white text-sm font-medium">{c.name}</TableCell>
                        <TableCell className="text-slate-300 text-sm font-mono">{c.phone}</TableCell>
                        <TableCell className="text-slate-400 text-sm">{c.company ?? "—"}</TableCell>
                        <TableCell>
                          <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">{c.source}</span>
                        </TableCell>
                        <TableCell>
                          {c.optedIn ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Opted In
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <XCircle className="w-3 h-3" /> Opted Out
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">{fmt(c.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {c.optedIn && (
                              <Button size="sm" variant="ghost"
                                onClick={() => optOut.mutate({ contactId: c.id, reason: "admin" })}
                                className="h-7 px-2 text-amber-400 hover:bg-amber-500/10 text-xs">
                                <UserX className="w-3.5 h-3.5 mr-1" /> Opt Out
                              </Button>
                            )}
                            <Button size="sm" variant="ghost"
                              onClick={() => deleteContact.mutate({ contactId: c.id })}
                              className="h-7 px-2 text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── CAMPAIGNS TAB ── */}
          {tab === "campaigns" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{campaigns.length} campaigns</span>
                <Button size="sm" onClick={() => setShowCreateCampaign(true)}
                  className="bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> New Campaign
                </Button>
              </div>

              <div className="space-y-3">
                {campaigns.length === 0 ? (
                  <div className="bg-[#0D1526] border border-white/5 rounded-xl p-10 text-center text-slate-500 text-sm">
                    No campaigns yet. Create your first SMS campaign above.
                  </div>
                ) : campaigns.map(c => (
                  <div key={c.id} className="bg-[#0D1526] border border-white/5 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-sm">{c.name}</h3>
                          <StatusBadge status={c.status} />
                        </div>
                        {c.description && <p className="text-xs text-slate-400 mb-2">{c.description}</p>}
                        <p className="text-xs text-slate-300 bg-white/5 rounded p-2.5 font-mono leading-relaxed line-clamp-2">{c.message}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {c.totalRecipients} recipients
                          </span>
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {c.totalSent} sent
                          </span>
                          {c.totalFailed > 0 && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> {c.totalFailed} failed
                            </span>
                          )}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmt(c.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {["draft", "scheduled"].includes(c.status) && (
                          <Button size="sm"
                            onClick={() => setShowSendConfirm(c.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                            <Send className="w-3.5 h-3.5 mr-1.5" /> Send Now
                          </Button>
                        )}
                        {["draft", "cancelled"].includes(c.status) && (
                          <Button size="sm" variant="ghost"
                            onClick={() => deleteCampaign.mutate({ campaignId: c.id })}
                            className="text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── OPT-OUT LOG TAB ── */}
          {tab === "optouts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{optOuts.length} opt-out records</span>
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  TCPA compliance log — immutable
                </span>
              </div>
              <div className="bg-[#0D1526] border border-white/5 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs">Phone</TableHead>
                      <TableHead className="text-slate-400 text-xs">Reason</TableHead>
                      <TableHead className="text-slate-400 text-xs">Source</TableHead>
                      <TableHead className="text-slate-400 text-xs">Processed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optOuts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-10 text-sm">
                          No opt-outs recorded. STOP commands will appear here.
                        </TableCell>
                      </TableRow>
                    ) : optOuts.map((o: any) => (
                      <TableRow key={o.id} className="border-white/5">
                        <TableCell className="font-mono text-sm text-slate-300">{o.phone}</TableCell>
                        <TableCell>
                          <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">{o.reason}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">{o.source}</TableCell>
                        <TableCell className="text-xs text-slate-500">{fmt(o.processedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ADD CONTACT DIALOG ── */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="bg-[#0D1526] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00D4FF]" /> Add SMS Contact
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
              <Input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Smith" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Phone (E.164 format) *</label>
              <Input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+12125551234" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono" />
              <p className="text-xs text-slate-500 mt-1">Format: +1 followed by 10 digits</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email (optional)</label>
              <Input value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@company.com" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Company (optional)</label>
              <Input value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))}
                placeholder="Acme Corp" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" />
              Only add contacts who have explicitly opted in to receive SMS from GigitekAI.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddContact(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={() => addContact.mutate({ name: contactForm.name, phone: contactForm.phone, email: contactForm.email || undefined, company: contactForm.company || undefined })}
              disabled={addContact.isPending || !contactForm.name || !contactForm.phone}
              className="bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold">
              {addContact.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE CAMPAIGN DIALOG ── */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="bg-[#0D1526] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00D4FF]" /> Create SMS Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Campaign Name *</label>
              <Input value={campaignForm.name} onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Q2 2026 Welcome Campaign" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description (optional)</label>
              <Input value={campaignForm.description} onChange={e => setCampaignForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Welcome message for new opted-in contacts" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Message * (max 1600 chars)</label>
              <Textarea value={campaignForm.message} onChange={e => setCampaignForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Hi {{name}}, welcome to GigitekAI! You've opted in to receive IT support updates and exclusive offers. Reply STOP to opt out."
                rows={4} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono text-sm resize-none" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-slate-500">Use {"{{name}}"} and {"{{company}}"} for personalization</p>
                <p className={`text-xs ${campaignForm.message.length > 1600 ? "text-red-400" : "text-slate-500"}`}>
                  {campaignForm.message.length}/1600
                </p>
              </div>
            </div>
            <div className="bg-[#0A0E1A] border border-white/5 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Preview</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {campaignForm.message
                  .replace(/\{\{name\}\}/gi, "Harry")
                  .replace(/\{\{company\}\}/gi, "GigitekAI") || "Your message will appear here..."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateCampaign(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={() => createCampaign.mutate({ name: campaignForm.name, description: campaignForm.description || undefined, message: campaignForm.message })}
              disabled={createCampaign.isPending || !campaignForm.name || !campaignForm.message}
              className="bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold">
              {createCampaign.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── TEST SMS DIALOG ── */}
      <Dialog open={showTestSms} onOpenChange={setShowTestSms}>
        <DialogContent className="bg-[#0D1526] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00D4FF]" /> Send Test SMS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">To Phone (E.164) *</label>
              <Input value={testForm.to} onChange={e => setTestForm(f => ({ ...f, to: e.target.value }))}
                placeholder="+16097676483" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Message *</label>
              <Textarea value={testForm.message} onChange={e => setTestForm(f => ({ ...f, message: e.target.value }))}
                rows={3} className="bg-white/5 border-white/10 text-white font-mono text-sm resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTestSms(false)} className="text-slate-400">Cancel</Button>
            <Button onClick={() => sendTest.mutate({ to: testForm.to, message: testForm.message })}
              disabled={sendTest.isPending || !testForm.to || !testForm.message}
              className="bg-[#00D4FF] hover:bg-cyan-400 text-black font-semibold">
              {sendTest.isPending ? "Sending..." : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SEND CONFIRM DIALOG ── */}
      <Dialog open={showSendConfirm !== null} onOpenChange={() => setShowSendConfirm(null)}>
        <DialogContent className="bg-[#0D1526] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" /> Confirm Send
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-slate-300">
              This will send to all <strong className="text-white">{contactsQ.data?.optedIn ?? 0} opted-in contacts</strong>.
              This action cannot be undone.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              All messages include STOP opt-out instructions per TCPA requirements.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSendConfirm(null)} className="text-slate-400">Cancel</Button>
            <Button onClick={() => showSendConfirm !== null && sendCampaign.mutate({ campaignId: showSendConfirm })}
              disabled={sendCampaign.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              {sendCampaign.isPending ? "Sending..." : "Send Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
