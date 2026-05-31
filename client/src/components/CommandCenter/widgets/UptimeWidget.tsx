import React from "react";
import { Activity } from "lucide-react";

interface UptimeWidgetProps {
  title: string;
  refreshInterval: number;
  config?: any;
}

export const UptimeWidget: React.FC<UptimeWidgetProps> = ({ title, refreshInterval }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-400" />
        <span className="text-sm font-medium text-slate-300">All Systems Operational</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">gigitekai.com</span>
          <span className="text-sm font-semibold text-green-400">99.9%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.9%" }}></div>
        </div>
      </div>
      <p className="text-xs text-slate-500">Refreshes every {refreshInterval / 1000}s</p>
    </div>
  );
};
