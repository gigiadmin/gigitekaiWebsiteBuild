import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Settings, Mail, Shield, Globe, Bell, Database, ChevronRight, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface SettingSection {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  items: string[];
  color: string;
}

const settingSections: SettingSection[] = [
  {
    icon: Globe,
    title: "General",
    description: "Site name, branding, timezone, and localization settings",
    items: ["Site Name & Logo", "Timezone & Language", "Maintenance Mode", "Custom Domain"],
    color: "text-[#00D4FF]",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Configure email providers, templates, and notification rules",
    items: ["SMTP / SendGrid Config", "Email Templates", "Notification Rules", "Test Email"],
    color: "text-purple-400",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Authentication, access control, and audit log settings",
    items: ["OAuth Providers", "Session Timeout", "IP Allowlist", "Audit Logs"],
    color: "text-green-400",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure system alerts, webhooks, and push notifications",
    items: ["Alert Channels", "Webhook Endpoints", "Push Notifications", "Digest Schedule"],
    color: "text-yellow-400",
  },
];

export default function AdminSettingsPage() {
  const [confirmClear, setConfirmClear] = useState(false);
  const [lastClearResult, setLastClearResult] = useState<{ emailsDeleted: number; metricsDeleted: number } | null>(null);

  const clearTestData = trpc.maintenance.clearTestData.useMutation({
    onSuccess: (data) => {
      setLastClearResult({ emailsDeleted: data.emailsDeleted, metricsDeleted: data.metricsDeleted });
      setConfirmClear(false);
      toast.success("Production cleanup complete", {
        description: `Cleared ${data.emailsDeleted} emails and ${data.metricsDeleted} metric records.`,
      });
    },
    onError: (err) => {
      toast.error("Cleanup failed", { description: err.message });
      setConfirmClear(false);
    },
  });

  const handleFeatureClick = (item: string) => {
    toast("Feature coming soon", {
      description: `${item} configuration will be available in a future update.`,
    });
  };

  return (
    <AdminLayoutWithSidebar currentPage="settings">
      <div className="p-6 bg-[#0A0E1A] min-h-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center border border-[#00D4FF]/20">
              <Settings className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">Settings</h1>
              <p className="text-gray-500 text-sm">System configuration &amp; administration</p>
            </div>
          </div>
        </div>

        {/* ── Production Readiness Panel ─────────────────────────────── */}
        <div className="mb-6 bg-[#0F1419] border border-orange-500/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/10">
              <Trash2 className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Production Readiness</h3>
              <p className="text-gray-500 text-xs">Clear test data before going live — emails and agent metrics</p>
            </div>
          </div>

          <div className="px-5 py-4">
            {/* What gets cleared */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#0A0E1A] border border-gray-800/40 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Will be cleared</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li className="flex items-center gap-2"><Trash2 className="w-3 h-3 text-orange-400" /> All portal emails (emailMessages)</li>
                  <li className="flex items-center gap-2"><Trash2 className="w-3 h-3 text-orange-400" /> All agent metrics (agentMetrics)</li>
                </ul>
              </div>
              <div className="bg-[#0A0E1A] border border-gray-800/40 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Will NOT be touched</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Helpdesk tickets</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Blog posts &amp; KB articles</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> User accounts &amp; team members</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Contact form submissions</li>
                </ul>
              </div>
            </div>

            {/* Last result */}
            {lastClearResult && (
              <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-green-300 text-sm">
                  Last cleanup: removed <strong>{lastClearResult.emailsDeleted}</strong> emails and <strong>{lastClearResult.metricsDeleted}</strong> metric records.
                </p>
              </div>
            )}

            {/* Action buttons */}
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-lg text-sm hover:bg-orange-500/20 transition-[opacity,transform]"
              >
                <Trash2 className="w-4 h-4" />
                Clear Test Data for Production
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <p className="text-orange-300 text-sm flex-1">This will permanently delete all emails and metrics. Are you sure?</p>
                <button
                  onClick={() => clearTestData.mutate()}
                  disabled={clearTestData.isPending}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-[opacity,transform]"
                >
                  {clearTestData.isPending ? "Clearing..." : "Yes, Clear Now"}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-[opacity,transform]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {settingSections.map((section) => (
            <div key={section.title} className="bg-[#0F1419] border border-gray-800/40 rounded-xl overflow-hidden">
              {/* Section Header */}
              <div className="px-5 py-4 border-b border-gray-800/40 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5`}>
                  <section.icon className={`w-4 h-4 ${section.color}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{section.title}</h3>
                  <p className="text-gray-500 text-xs">{section.description}</p>
                </div>
              </div>

              {/* Section Items */}
              <div className="divide-y divide-gray-800/40">
                {section.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleFeatureClick(item)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02] transition-[opacity,transform] group"
                  >
                    <span className="text-gray-400 text-sm group-hover:text-gray-200 transition-colors">{item}</span>
                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-6 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-4 flex items-start gap-3">
          <Settings className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#00D4FF] text-sm font-medium">Full Settings Panel Coming Soon</p>
            <p className="text-gray-500 text-xs mt-1">
              All configuration options will be fully functional in a future release. Currently, system settings can be managed through the Manus project management interface.
            </p>
          </div>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}
