import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Star, BarChart2, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminSurveysPage() {
  const handleFeatureClick = () => {
    toast("Feature coming soon", {
      description: "Survey analytics will be available in a future update.",
    });
  };

  return (
    
    <AdminLayout><AdminLayoutWithSidebar currentPage="surveys">
      <div className="p-6 bg-[#0A0E1A] min-h-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center border border-[#00D4FF]/20">
              <Star className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">Surveys</h1>
              <p className="text-gray-500 text-sm">Customer satisfaction &amp; feedback analytics</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-8 text-center mb-8">
          <div className="w-16 h-16 bg-[#00D4FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#00D4FF]/20">
            <Star className="w-8 h-8 text-[#00D4FF]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 font-['Space_Grotesk']">Survey Analytics Coming Soon</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Customer satisfaction surveys, NPS tracking, and feedback analytics will be available in a future update.
          </p>
        </div>

        {/* Placeholder Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Star, label: "Total Surveys", value: "—", color: "text-[#00D4FF]" },
            { icon: Users, label: "Responses", value: "—", color: "text-purple-400" },
            { icon: TrendingUp, label: "Avg. NPS Score", value: "—", color: "text-green-400" },
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

        {/* Placeholder Chart Area */}
        <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-[#00D4FF]" />
            <h3 className="text-white font-medium text-sm">Response Trends</h3>
          </div>
          <div
            className="h-48 flex items-center justify-center border border-dashed border-gray-700/50 rounded-lg cursor-pointer hover:border-[#00D4FF]/30 transition-all"
            onClick={handleFeatureClick}
          >
            <p className="text-gray-600 text-sm">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  
    </AdminLayout>);
}
