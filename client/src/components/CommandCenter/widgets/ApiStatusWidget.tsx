import React from "react";
import { Zap } from "lucide-react";

interface ApiStatusWidgetProps {
  title: string;
  refreshInterval: number;
  config?: any;
}

export const ApiStatusWidget: React.FC<ApiStatusWidgetProps> = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        <span className="text-sm font-medium text-slate-300">API Status</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
          <span className="text-sm text-slate-300">Microsoft Graph</span>
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
          <span className="text-sm text-slate-300">Twilio</span>
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
          <span className="text-sm text-slate-300">SendGrid</span>
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </div>
      </div>
    </div>
  );
};
