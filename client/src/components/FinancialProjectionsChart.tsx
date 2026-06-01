/**
 * FinancialProjectionsChart.tsx
 *
 * Interactive 3-year financial projections chart
 * Shows revenue, expenses, and cumulative cash position
 * Uses recharts (already bundled) to avoid chart.js/auto circular dependency
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';

// 3-year monthly data (36 months)
const months = Array.from({ length: 36 }, (_, i) => {
  const month = i % 12;
  const year = Math.floor(i / 12) + 1;
  return `M${month + 1} Y${year}`;
});

const revenueByYear = [0, 1800000, 6000000, 18000000];
const expensesByYear = [0, 1200000, 2800000, 5400000];

const chartData = months.map((label, i) => {
  const year = Math.floor(i / 12) + 1;
  const monthProgress = (i % 12) / 12;
  const revenue = Math.round(
    revenueByYear[year] + (revenueByYear[year + 1] - revenueByYear[year]) * monthProgress
  );
  const expenses = Math.round(
    expensesByYear[year] + (expensesByYear[year + 1] - expensesByYear[year]) * monthProgress
  );
  return { label, revenue, expenses };
});

// Compute cumulative cash position
let running = -1000000;
const data = chartData.map((d) => {
  running += d.revenue - d.expenses;
  return { ...d, cumulative: Math.round(running) };
});

const formatDollar = (v: number) => '$' + (v / 1_000_000).toFixed(1) + 'M';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded p-3 text-sm">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatDollar(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function FinancialProjectionsChart() {
  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">3-Year Financial Projections</h3>
        <p className="text-sm text-slate-400">
          Conservative growth model based on $75K customer LTV and 5:1 LTV:CAC ratio
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            interval={5}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={formatDollar}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            label={{ value: 'Revenue & Expenses', angle: -90, position: 'insideLeft', fill: '#E2E8F0', fontSize: 11 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={formatDollar}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            label={{ value: 'Cumulative Cash', angle: 90, position: 'insideRight', fill: '#E2E8F0', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#E2E8F0', fontSize: 12, paddingTop: 12 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            name="Revenue (ARR)"
            stroke="#00D4FF"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="expenses"
            name="Operating Expenses"
            stroke="#FF6B6B"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            name="Cumulative Cash"
            stroke="#4ADE80"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Year 1 ARR</p>
          <p className="text-2xl font-bold text-cyan-400">$1.8M</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Year 2 ARR</p>
          <p className="text-2xl font-bold text-cyan-400">$6.0M</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Year 3 ARR</p>
          <p className="text-2xl font-bold text-cyan-400">$18.0M</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Projections assume 10 customers Year 1, 50 customers Year 2, 100+ customers Year 3 at $75K LTV
      </p>
    </Card>
  );
}
