import React from "react";
import { Users } from "lucide-react";

interface AgentsWidgetProps {
  title: string;
  refreshInterval: number;
  config?: any;
}

export const AgentsWidget: React.FC<AgentsWidgetProps> = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">Active Agents</span>
        </div>
        <span className="text-lg font-bold text-blue-400">12</span>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-slate-400">Status breakdown:</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-700 rounded">
            <div className="text-green-400 font-semibold">8</div>
            <div className="text-xs text-slate-400">Available</div>
          </div>
          <div className="p-2 bg-slate-700 rounded">
            <div className="text-yellow-400 font-semibold">3</div>
            <div className="text-xs text-slate-400">Busy</div>
          </div>
          <div className="p-2 bg-slate-700 rounded">
            <div className="text-red-400 font-semibold">1</div>
            <div className="text-xs text-slate-400">Away</div>
          </div>
        </div>
      </div>
    </div>
  );
};
