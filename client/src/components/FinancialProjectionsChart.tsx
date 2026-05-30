/**
 * FinancialProjectionsChart.tsx
 * 
 * Interactive 3-year financial projections chart
 * Shows revenue, expenses, and profitability trajectory
 */

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Card } from '@/components/ui/card';

export default function FinancialProjectionsChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 3-year financial projections
    const months = Array.from({ length: 36 }, (_, i) => {
      const month = i % 12;
      const year = Math.floor(i / 12) + 1;
      return `M${month + 1} Y${year}`;
    });

    // Revenue projection (ARR growth)
    const revenue = Array.from({ length: 36 }, (_, i) => {
      const year = Math.floor(i / 12) + 1;
      const baseYear = [0, 1800000, 6000000, 18000000][year] || 18000000;
      const monthProgress = (i % 12) / 12;
      const nextYearBase = [0, 1800000, 6000000, 18000000][year + 1] || 18000000;
      return Math.round(baseYear + (nextYearBase - baseYear) * monthProgress);
    });

    // Operating expenses
    const expenses = Array.from({ length: 36 }, (_, i) => {
      const year = Math.floor(i / 12) + 1;
      const baseYear = [0, 1200000, 2800000, 5400000][year] || 5400000;
      const monthProgress = (i % 12) / 12;
      const nextYearBase = [0, 1200000, 2800000, 5400000][year + 1] || 5400000;
      return Math.round(baseYear + (nextYearBase - baseYear) * monthProgress);
    });

    // Cumulative burn / profit
    const cumulative = Array.from({ length: 36 }, (_, i) => {
      let total = -1000000; // Initial seed funding
      for (let j = 0; j <= i; j++) {
        total += revenue[j] - expenses[j];
      }
      return total;
    });

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Revenue (ARR)',
            data: revenue,
            borderColor: '#00D4FF',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#00D4FF',
          },
          {
            label: 'Operating Expenses',
            data: expenses,
            borderColor: '#FF6B6B',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#FF6B6B',
          },
          {
            label: 'Cumulative Cash Position',
            data: cumulative,
            borderColor: '#4ADE80',
            backgroundColor: 'rgba(74, 222, 128, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#4ADE80',
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#E2E8F0',
              font: { size: 12, weight: 'bold' },
              padding: 15,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#E2E8F0',
            bodyColor: '#CBD5E1',
            borderColor: '#475569',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += '$' + context.parsed.y.toLocaleString();
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              color: '#94A3B8',
              callback: function (value) {
                return '$' + (value as number / 1000000).toFixed(1) + 'M';
              },
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            title: {
              display: true,
              text: 'Revenue & Expenses',
              color: '#E2E8F0',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: {
              color: '#94A3B8',
              callback: function (value) {
                return '$' + (value as number / 1000000).toFixed(1) + 'M';
              },
            },
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Cumulative Cash',
              color: '#E2E8F0',
            },
          },
          x: {
            ticks: {
              color: '#94A3B8',
              maxRotation: 45,
              minRotation: 0,
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
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
  }, []);

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">3-Year Financial Projections</h3>
        <p className="text-sm text-slate-400">
          Conservative growth model based on $75K customer LTV and 5:1 LTV:CAC ratio
        </p>
      </div>

      <div style={{ height: '400px', position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>

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
