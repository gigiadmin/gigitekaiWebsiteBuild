import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Download, TrendingUp, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdminSatisfactionDashboard() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  
  // Fetch customer feedback data
  const { data: feedbackData, isLoading } = trpc.helpdesk.getCustomerFeedback.useQuery({
    days: dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90,
  });

  // Calculate NPS score
  const npsScore = useMemo(() => {
    if (!feedbackData?.feedbacks || feedbackData.feedbacks.length === 0) return 0;
    
    const promoters = feedbackData.feedbacks.filter((f: any) => f.npsScore >= 9).length;
    const detractors = feedbackData.feedbacks.filter((f: any) => f.npsScore <= 6).length;
    const total = feedbackData.feedbacks.length;
    
    return total > 0 ? ((promoters - detractors) / total) * 100 : 0;
  }, [feedbackData]);

  // Prepare trend data
  const trendData = useMemo(() => {
    if (!feedbackData?.feedbacks) return [];
    
    const grouped = feedbackData.feedbacks.reduce((acc: any, f: any) => {
      const date = new Date(f.createdAt).toLocaleDateString();
      const existing = acc.find((item: any) => item.date === date);
      
      if (existing) {
        existing.count += 1;
        existing.avgNps = (existing.avgNps * (existing.count - 1) + f.npsScore) / existing.count;
      } else {
        acc.push({ date, count: 1, avgNps: f.npsScore });
      }
      return acc;
    }, []);
    
    return grouped.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [feedbackData]);

  // Prepare sentiment breakdown
  const sentimentData = useMemo(() => {
    if (!feedbackData?.feedbacks) return [];
    
    const sentiments = {
      positive: feedbackData.feedbacks.filter((f: any) => f.sentiment === "positive").length,
      neutral: feedbackData.feedbacks.filter((f: any) => f.sentiment === "neutral").length,
      negative: feedbackData.feedbacks.filter((f: any) => f.sentiment === "negative").length,
    };
    
    return [
      { name: "Positive", value: sentiments.positive, fill: "#10b981" },
      { name: "Neutral", value: sentiments.neutral, fill: "#6b7280" },
      { name: "Negative", value: sentiments.negative, fill: "#ef4444" },
    ];
  }, [feedbackData]);

  // Prepare NPS distribution
  const npsDistribution = useMemo(() => {
    if (!feedbackData?.feedbacks) return [];
    
    const bins = [
      { range: "0-3", count: 0 },
      { range: "4-6", count: 0 },
      { range: "7-8", count: 0 },
      { range: "9-10", count: 0 },
    ];
    
    feedbackData.feedbacks.forEach((f: any) => {
      if (f.npsScore <= 3) bins[0].count++;
      else if (f.npsScore <= 6) bins[1].count++;
      else if (f.npsScore <= 8) bins[2].count++;
      else bins[3].count++;
    });
    
    return bins;
  }, [feedbackData]);

  const handleExportCSV = () => {
    if (!feedbackData?.feedbacks) return;
    
    const csv = [
      ["Date", "NPS Score", "Sentiment", "Feedback", "Agent"],
      ...feedbackData.feedbacks.map((f: any) => [
        new Date(f.createdAt).toLocaleString(),
        f.npsScore,
        f.sentiment,
        f.feedbackText || "",
        f.agentName || "N/A",
      ]),
    ]
      .map((row: any) => row.map((cell: any) => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `satisfaction-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast.success("Report exported successfully");
  };

  if (isLoading) {
    return <div className="p-8">Loading satisfaction data...</div>;
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Satisfaction</h1>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              onClick={() => setDateRange(range)}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{npsScore.toFixed(1)}</div>
            <p className="text-xs text-gray-600 mt-1">Net Promoter Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedbackData?.feedbacks?.length || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Responses collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {feedbackData?.feedbacks && feedbackData.feedbacks.length > 0
                ? (feedbackData.feedbacks.reduce((sum: number, f: any) => sum + f.npsScore, 0) / feedbackData.feedbacks.length).toFixed(1)
                : "N/A"}
            </div>
            <p className="text-xs text-gray-600 mt-1">Out of 10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Positive %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {feedbackData?.feedbacks && feedbackData.feedbacks.length > 0
                ? ((feedbackData.feedbacks.filter((f: any) => f.sentiment === "positive").length / feedbackData.feedbacks.length) * 100).toFixed(0)
                : "0"}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Positive sentiment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS Trend */}
        <Card>
          <CardHeader>
            <CardTitle>NPS Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgNps" stroke="#3b82f6" name="Avg NPS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NPS Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>NPS Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={npsDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feedback Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#06b6d4" name="Responses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbackData?.feedbacks?.slice(0, 5).map((feedback: any) => (
              <div key={feedback.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">Score: {feedback.npsScore}/10</div>
                    <div className="text-sm text-gray-600">{feedback.feedbackText}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(feedback.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    feedback.sentiment === "positive" ? "bg-green-100 text-green-800" :
                    feedback.sentiment === "negative" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {feedback.sentiment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
