import React from "react";
import { AlertTriangle } from "lucide-react";

interface AlertsWidgetProps {
  title: string;
  refreshInterval: number;
  config?: any;
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <span className="text-sm font-medium text-slate-300">Active Alerts</span>
      </div>
      <div className="space-y-2">
        <div className="p-2 bg-red-900/20 border border-red-700 rounded text-sm">
          <div className="font-semibold text-red-400">High CPU Usage</div>
          <div className="text-xs text-red-300">Server-01: 92%</div>
        </div>
        <div className="p-2 bg-yellow-900/20 border border-yellow-700 rounded text-sm">
          <div className="font-semibold text-yellow-400">Disk Space Low</div>
          <div className="text-xs text-yellow-300">Database: 85% full</div>
        </div>
      </div>
    </div>
  );
};
