/**
 * Admin SLA Compliance & Categorization Dashboard
 * Displays real-time SLA metrics, ticket categorization, and performance analytics
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export default function AdminSLADashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [reportType, setReportType] = useState<
    "technician" | "category" | "client" | "comprehensive"
  >("comprehensive");

  // Fetch SLA metrics
  const { data: overallSummary } = trpc.slaComplianceReports.getOverallSummary.useQuery(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    { enabled: !!user }
  );

  const { data: technicianMetrics } =
    trpc.slaComplianceReports.getMetricsByTechnician.useQuery(
      {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      { enabled: !!user }
    );

  const { data: categoryMetrics } =
    trpc.slaComplianceReports.getMetricsByCategory.useQuery(
      {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      { enabled: !!user }
    );

  const { data: categorizationMetrics } =
    trpc.ticketAICategorization.getCategorizationMetrics.useQuery(undefined, {
      enabled: !!user,
    });

  // Generate PDF report
  const generateReportMutation = trpc.slaComplianceReports.generatePDFReport.useMutation();

  const handleGenerateReport = async () => {
    try {
      await generateReportMutation.mutateAsync({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        reportType,
      });
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  const COLORS = ["#00D4FF", "#22c55e", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">SLA & Categorization Dashboard</h1>
          <p className="text-gray-400">
            {dateRange.startDate.toLocaleDateString()} -{" "}
            {dateRange.endDate.toLocaleDateString()}
          </p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={generateReportMutation.isPending}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate.toISOString().split("T")[0]}
            onChange={(e) =>
              setDateRange({
                ...dateRange,
                startDate: new Date(e.target.value),
              })
            }
            className="mt-1 rounded bg-gray-800 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate.toISOString().split("T")[0]}
            onChange={(e) =>
              setDateRange({
                ...dateRange,
                endDate: new Date(e.target.value),
              })
            }
            className="mt-1 rounded bg-gray-800 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) =>
              setReportType(
                e.target.value as
                  | "technician"
                  | "category"
                  | "client"
                  | "comprehensive"
              )
            }
            className="mt-1 rounded bg-gray-800 px-3 py-2 text-white"
          >
            <option value="comprehensive">Comprehensive</option>
            <option value="technician">By Technician</option>
            <option value="category">By Category</option>
            <option value="client">By Client</option>
          </select>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-cyan-900/50 to-cyan-900/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Tickets</p>
              <p className="text-3xl font-bold text-cyan-400">
                {overallSummary?.totalTickets || 0}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-cyan-400" />
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-900/50 to-green-900/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">On-Time</p>
              <p className="text-3xl font-bold text-green-400">
                {overallSummary?.resolvedOnTime || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-900/50 to-orange-900/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Late</p>
              <p className="text-3xl font-bold text-orange-400">
                {overallSummary?.resolvedLate || 0}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-400" />
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-900/50 to-blue-900/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Compliance Rate</p>
              <p className="text-3xl font-bold text-blue-400">
                {overallSummary?.complianceRate || 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Technician Performance */}
        {technicianMetrics && technicianMetrics.length > 0 && (
          <Card className="border-0 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">
              Technician Performance
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={technicianMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="technicianName" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
                />
                <Legend />
                <Bar dataKey="complianceRate" fill="#00D4FF" name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Category Distribution */}
        {categoryMetrics && categoryMetrics.length > 0 && (
          <Card className="border-0 bg-gray-900/50 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">
              Category Performance
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryMetrics}
                  dataKey="totalTickets"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {categoryMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* AI Categorization Metrics */}
      {categorizationMetrics && (
        <Card className="border-0 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">
            AI Categorization Metrics
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-400">AI Categorized</p>
              <p className="text-2xl font-bold text-cyan-400">
                {categorizationMetrics.aiCategorizedCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Average Confidence</p>
              <p className="text-2xl font-bold text-green-400">
                {(categorizationMetrics.averageAIConfidence * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Uncategorized</p>
              <p className="text-2xl font-bold text-orange-400">
                {categorizationMetrics.uncategorizedCount}
              </p>
            </div>
          </div>

          {/* Category Distribution Table */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-300">
              Category Distribution
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-2 text-left text-gray-400">Category</th>
                    <th className="px-4 py-2 text-right text-gray-400">Count</th>
                    <th className="px-4 py-2 text-right text-gray-400">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {categorizationMetrics.categoryDistribution.map((cat: any) => (
                    <tr key={cat.category} className="border-b border-gray-800">
                      <td className="px-4 py-2 text-gray-300">{cat.category}</td>
                      <td className="px-4 py-2 text-right text-gray-300">
                        {cat.count}
                      </td>
                      <td className="px-4 py-2 text-right text-cyan-400">
                        {(
                          (cat.count /
                            categorizationMetrics.categoryDistribution.reduce(
                              (sum: number, c: any) => sum + c.count,
                              0
                            )) *
                          100
                        ).toFixed(1)}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Technician Table */}
      {technicianMetrics && technicianMetrics.length > 0 && (
        <Card className="border-0 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">
            Detailed Technician Metrics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left text-gray-400">Technician</th>
                  <th className="px-4 py-2 text-right text-gray-400">Total</th>
                  <th className="px-4 py-2 text-right text-gray-400">On-Time</th>
                  <th className="px-4 py-2 text-right text-gray-400">Late</th>
                  <th className="px-4 py-2 text-right text-gray-400">Compliance</th>
                  <th className="px-4 py-2 text-right text-gray-400">
                    Avg Resolution
                  </th>
                </tr>
              </thead>
              <tbody>
                {technicianMetrics.map((tech: any) => (
                  <tr key={tech.technicianId} className="border-b border-gray-800">
                    <td className="px-4 py-2 text-gray-300">
                      {tech.technicianName}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300">
                      {tech.totalTickets}
                    </td>
                    <td className="px-4 py-2 text-right text-green-400">
                      {tech.resolvedOnTime}
                    </td>
                    <td className="px-4 py-2 text-right text-orange-400">
                      {tech.resolvedLate}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={
                          tech.complianceRate >= 95
                            ? "text-green-400"
                            : tech.complianceRate >= 80
                              ? "text-orange-400"
                              : "text-red-400"
                        }
                      >
                        {tech.complianceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300">
                      {tech.averageResolutionTime} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
