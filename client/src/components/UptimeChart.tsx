/**
 * Uptime Chart Component
 * 
 * Displays uptime trends using Chart.js
 */

import { useEffect, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Card } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

export function UptimeChart({ service, trendData, isLoading = false }: UptimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !trendData || trendData.length === 0) return;

    // Destroy previous chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Format data for chart
    const labels = trendData.map((point) => {
      const date = new Date(point.timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    });

    const uptimeData = trendData.map((point) => point.uptimePercentage);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(0, 212, 255, 0.3)");
    gradient.addColorStop(1, "rgba(0, 212, 255, 0.01)");

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${service} Uptime %`,
            data: uptimeData,
            borderColor: "#00D4FF",
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#00D4FF",
            pointBorderColor: "#0A0E1A",
            pointBorderWidth: 2,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#9CA3AF",
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: "rgba(10, 14, 26, 0.9)",
            titleColor: "#00D4FF",
            bodyColor: "#E5E7EB",
            borderColor: "#00D4FF",
            borderWidth: 1,
            padding: 12,
            displayColors: false,
              callbacks: {
                label: (context: any) => {
                  return `Uptime: ${context.parsed.y.toFixed(2)}%`;
                },
              },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: "#9CA3AF",
              font: { size: 11 },
              callback: (value: any) => `${value}%`,
            },
            grid: {
              color: "rgba(107, 114, 128, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#9CA3AF",
              font: { size: 11 },
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [trendData, service]);

  if (isLoading) {
    return (
      <Card className="border border-gray-700/50 bg-gray-900/30 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
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
          <div className="text-center">
            <p className="text-gray-400 text-sm">No uptime data available yet</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-700/50 bg-gray-900/30 p-6">
      <div style={{ height: "300px" }}>
        <canvas ref={canvasRef} />
      </div>
    </Card>
  );
}
