import React from "react";
import { Mail } from "lucide-react";

interface EmailWidgetProps {
  title: string;
  refreshInterval: number;
  config?: any;
}

export const EmailWidget: React.FC<EmailWidgetProps> = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-medium text-slate-300">Email Queue</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Pending</span>
          <span className="font-semibold text-purple-400">24</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Sent Today</span>
          <span className="font-semibold text-green-400">1,234</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Failed</span>
          <span className="font-semibold text-red-400">2</span>
        </div>
      </div>
    </div>
  );
};
