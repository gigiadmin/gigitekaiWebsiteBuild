import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Zap, Users, Clock, Activity } from "lucide-react";
import { toast } from "sonner";

export default function AdminWorkloadPage() {
  const handleFeatureClick = () => {
    toast("Feature coming soon", {
      description: "Agent workload management will be available in a future update.",
    });
  };

  return (
    <AdminLayoutWithSidebar currentPage="workload">
      <div className="p-6 bg-[#0A0E1A] min-h-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center border border-[#00D4FF]/20">
              <Zap className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">Workload</h1>
              <p className="text-gray-500 text-sm">Agent workload distribution &amp; capacity management</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-8 text-center mb-8">
          <div className="w-16 h-16 bg-[#00D4FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#00D4FF]/20">
            <Zap className="w-8 h-8 text-[#00D4FF]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 font-['Space_Grotesk']">Workload Management Coming Soon</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            AI-powered workload balancing, agent capacity tracking, and intelligent ticket routing will be available in a future update.
          </p>
        </div>

        {/* Placeholder Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: "Active Agents", value: "—", color: "text-[#00D4FF]" },
            { icon: Clock, label: "Avg. Handle Time", value: "—", color: "text-yellow-400" },
            { icon: Activity, label: "Queue Depth", value: "—", color: "text-red-400" },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={handleFeatureClick}
              className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-5 text-left hover:border-[#00D4FF]/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-600 font-['Space_Grotesk']">{stat.value}</p>
            </button>
          ))}
        </div>

        {/* Placeholder Workload Table */}
        <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#00D4FF]" />
            <h3 className="text-white font-medium text-sm">Agent Workload Distribution</h3>
          </div>
          <div
            className="h-48 flex items-center justify-center border border-dashed border-gray-700/50 rounded-lg cursor-pointer hover:border-[#00D4FF]/30 transition-all"
            onClick={handleFeatureClick}
          >
            <p className="text-gray-600 text-sm">Workload distribution chart coming soon</p>
          </div>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}
