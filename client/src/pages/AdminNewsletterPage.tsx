/**
 * AdminNewsletterPage — Newsletter module inside unified AdminLayout
 * Shows both Subscribers and Broadcast tabs
 */
import AdminLayout from "@/components/AdminLayout";
import AdminNewsletter from "./AdminNewsletter";
import AdminNewsletterBroadcast from "./AdminNewsletterBroadcast";
import { useState } from "react";
import { Mail, Send } from "lucide-react";

type Tab = "subscribers" | "broadcast";

export default function AdminNewsletterPage() {
  const [tab, setTab] = useState<Tab>("subscribers");

  return (
    <AdminLayout title="Newsletter">
      <div className="space-y-4">
        {/* Sub-tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
          {([
            { id: "subscribers" as Tab, label: "Subscribers", icon: <Mail size={13} /> },
            { id: "broadcast" as Tab, label: "Broadcast", icon: <Send size={13} /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === "subscribers" && <AdminNewsletter />}
        {tab === "broadcast" && <AdminNewsletterBroadcast />}
      </div>
    </AdminLayout>
  );
}
