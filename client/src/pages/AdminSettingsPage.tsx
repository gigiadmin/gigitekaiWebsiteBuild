import AdminLayout from "@/components/AdminLayout";
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Settings, Mail, Shield, Globe, Bell, Database, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  {
    icon: Database,
    title: "Data & Storage",
    description: "Database maintenance, backups, and data retention policies",
    items: ["Data Retention", "Export Data", "Backup Schedule", "Storage Usage"],
    color: "text-orange-400",
  },
];

export default function AdminSettingsPage() {
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
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02] transition-all group"
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
