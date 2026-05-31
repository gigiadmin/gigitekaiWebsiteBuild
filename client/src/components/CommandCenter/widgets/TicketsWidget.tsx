import React from "react";
import { Ticket } from "lucide-react";

interface TicketsWidgetProps {
  title: string;
  refreshInterval: number;
  config?: any;
}

export const TicketsWidget: React.FC<TicketsWidgetProps> = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Ticket className="w-5 h-5 text-orange-400" />
        <span className="text-sm font-medium text-slate-300">Support Tickets</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Open</span>
          <span className="font-semibold text-orange-400">18</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">In Progress</span>
          <span className="font-semibold text-blue-400">7</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Avg Response</span>
          <span className="font-semibold text-green-400">2.3h</span>
        </div>
      </div>
    </div>
  );
};
