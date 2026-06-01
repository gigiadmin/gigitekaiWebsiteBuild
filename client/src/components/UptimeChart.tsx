/**
 * Uptime Chart Component
 *
 * Displays uptime trends using recharts (replaces chart.js to avoid circular dependency crash)
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface UptimeTrendPoint {
  timestamp: string;
  uptimePercentage: number;
  checksCount: number;
}

interface UptimeChartProps {
  service: string;
  trendData: UptimeTrendPoint[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(10,14,26,0.9)",
        border: "1px solid #00D4FF",
        borderRadius: 6,
        padding: "10px 14px",
      }}
    >
      <p style={{ color: "#00D4FF", fontSize: 12, margin: 0 }}>
        Uptime: {payload[0]?.value?.toFixed(2)}%
      </p>
    </div>
  );
};

export function UptimeChart({ service, trendData, isLoading = false }: UptimeChartProps) {
  if (isLoading) {
    return (
      <Card className="border border-gray-700/50 bg-gray-900/30 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading uptime data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <Card className="border border-gray-700/50 bg-gray-900/30 p-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-400 text-sm">No uptime data available yet</p>
        </div>
      </Card>
    );
  }

  const data = trendData.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    uptime: point.uptimePercentage,
  }));

  return (
    <Card className="border border-gray-700/50 bg-gray-900/30 p-6">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.1)" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={() => `${service} Uptime %`}
            wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="uptime"
            stroke="#00D4FF"
            strokeWidth={2}
            fill="url(#uptimeGradient)"
            dot={{ r: 3, fill: "#00D4FF", stroke: "#0A0E1A", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
