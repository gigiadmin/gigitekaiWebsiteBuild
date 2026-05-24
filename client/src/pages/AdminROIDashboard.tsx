/**
 * AdminROIDashboard — Phase D
 * Forrester TEI-aligned ROI reporting dashboard for GigitekAI MSP operations.
 * Surfaces: ticket reduction, AHT savings, AI deflection, uptime SLA, cost avoidance.
 *
 * Design: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
 * Fonts: Space Grotesk (display) + DM Sans (body)
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Ticket,
  Bot,
  DollarSign,
  Activity,
  Star,
  ChevronLeft,
  RefreshCw,
  Download,
  BookOpen,
  Phone,
  Shield,
  Target,
  Zap,
} from "lucide-react";
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
} from "recharts";
import { toast } from "sonner";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const CYAN = "#00D4FF";
const NAVY = "#0A0E1A";
const CARD_BG = "#0D1526";
const BORDER = "#1A2540";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const PURPLE = "#8B5CF6";

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "12px",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <p style={{ color: "#94A3B8", marginBottom: "6px", fontWeight: 600 }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color, margin: "2px 0" }}>
          {entry.name}: {typeof entry.value === "number" && entry.value > 100
            ? `$${entry.value.toLocaleString()}`
            : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accentColor?: string;
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  trend,
  trendLabel,
  accentColor = CYAN,
}: MetricCardProps) {
  const trendColor =
    trend === "up" ? GREEN : trend === "down" ? "#EF4444" : "#6B7280";
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderTop: `2px solid ${accentColor}`,
        borderRadius: "12px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            color: accentColor,
            background: `${accentColor}15`,
            borderRadius: "8px",
            padding: "8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </div>
        <span
          style={{
            color: "#94A3B8",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: "#F1F5F9",
          fontFamily: "Space Grotesk, sans-serif",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {(sub || trendLabel) && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {trendLabel && (
            <span style={{ color: trendColor, fontSize: "12px", fontWeight: 600 }}>
              {trendArrow} {trendLabel}
            </span>
          )}
          {sub && (
            <span style={{ color: "#64748B", fontSize: "12px" }}>{sub}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Benchmark Row ─────────────────────────────────────────────────────────────
function BenchmarkRow({
  label,
  yourValue,
  benchmark,
  unit,
  higherIsBetter = true,
}: {
  label: string;
  yourValue: number;
  benchmark: number;
  unit: string;
  higherIsBetter?: boolean;
}) {
  const isWinning = higherIsBetter ? yourValue >= benchmark : yourValue <= benchmark;
  const pct = Math.min(100, (yourValue / (benchmark * 1.5)) * 100);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span style={{ color: "#CBD5E1", fontSize: "13px", fontFamily: "DM Sans, sans-serif" }}>
          {label}
        </span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span
            style={{
              color: isWinning ? GREEN : AMBER,
              fontWeight: 700,
              fontSize: "13px",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            {yourValue.toFixed(1)}{unit}
          </span>
          <span style={{ color: "#475569", fontSize: "12px" }}>
            vs {benchmark}{unit} industry
          </span>
        </div>
      </div>
      <div
        style={{
          height: "6px",
          background: "#1E2D45",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: isWinning
              ? `linear-gradient(90deg, ${GREEN}, #34D399)`
              : `linear-gradient(90deg, ${AMBER}, #FCD34D)`,
            borderRadius: "3px",
          }}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminROIDashboard() {
  const [periodDays, setPeriodDays] = useState(30);

  const { data: metrics, isLoading, refetch } = trpc.roiMetrics.getCurrent.useQuery(
    { periodDays },
    { refetchInterval: 300_000 }
  );

  const { data: history, isLoading: historyLoading } =
    trpc.roiMetrics.getHistory.useQuery({ months: 6 });

  // ── Chart data ──────────────────────────────────────────────────────────────
  const ticketChartData = useMemo(
    () =>
      history?.map((h) => ({
        month: h.label,
        "Total Tickets": h.ticketCount ?? 0,
        Resolved: h.resolvedCount ?? 0,
      })) ?? [],
    [history]
  );

  const savingsChartData = useMemo(
    () =>
      history?.map((h) => ({
        month: h.label,
        "Savings ($)": Math.round((h as any).estimatedCostSavings ?? 0),
        "Hours Freed": Math.round((h as any).hoursFreed ?? 0),
      })) ?? [],
    [history]
  );

  const fmt = (n: number | null | undefined, decimals = 0) =>
    n == null ? "—" : n.toFixed(decimals);

  const fmtCurrency = (n: number | null | undefined) =>
    n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

  const fmtPct = (n: number | null | undefined) =>
    n == null ? "—" : `${n.toFixed(1)}%`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: NAVY,
        color: "#F1F5F9",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: CARD_BG,
          borderBottom: `1px solid ${BORDER}`,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/admin">
            <button
              style={{
                background: "transparent",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#94A3B8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
              }}
            >
              <ChevronLeft size={14} /> Admin
            </button>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: `${CYAN}20`,
                borderRadius: "8px",
                padding: "8px",
                color: CYAN,
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#F1F5F9",
                  margin: 0,
                }}
              >
                ROI Dashboard
              </h1>
              <p style={{ color: "#64748B", fontSize: "12px", margin: 0 }}>
                Forrester TEI Metrics · Real-time operational data
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriodDays(d)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: `1px solid ${periodDays === d ? CYAN : BORDER}`,
                background: periodDays === d ? `${CYAN}20` : "transparent",
                color: periodDays === d ? CYAN : "#64748B",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {d}d
            </button>
          ))}

          <button
            onClick={() => { refetch(); toast.success("Metrics refreshed"); }}
            style={{
              background: "transparent",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#94A3B8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <button
            onClick={() => toast.info("Export — use browser print for now")}
            style={{
              background: `${CYAN}20`,
              border: `1px solid ${CYAN}40`,
              borderRadius: "8px",
              padding: "8px 14px",
              color: CYAN,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "28px 32px", maxWidth: "1400px", margin: "0 auto" }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
              color: CYAN,
              gap: "12px",
              fontSize: "16px",
            }}
          >
            <RefreshCw size={20} /> Loading metrics…
          </div>
        ) : (
          <>
            {/* ── Forrester TEI Banner ── */}
            <div
              style={{
                background: `linear-gradient(135deg, ${CYAN}10, ${PURPLE}10)`,
                border: `1px solid ${CYAN}30`,
                borderRadius: "12px",
                padding: "16px 24px",
                marginBottom: "28px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: CYAN }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#F1F5F9",
                  }}
                >
                  Forrester Total Economic Impact™ Framework
                </div>
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  Benchmarks: $75/hr IT rate · 22min manual AHT → 8min AI AHT · 65% deflection savings · 99.9% uptime SLA
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                {[
                  { value: "$792K–$2.7M", label: "3-Year NPV Range", color: CYAN },
                  { value: "3–4 mo", label: "Payback Period", color: GREEN },
                  { value: "280+ hrs", label: "Freed Monthly", color: PURPLE },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "Space Grotesk, sans-serif",
                        fontWeight: 700,
                        fontSize: "22px",
                        color: item.color,
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ color: "#64748B", fontSize: "11px" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Metric Cards Grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              <MetricCard
                icon={<Ticket size={18} />}
                label="Total Tickets"
                value={fmt(metrics?.ticketCount)}
                sub={`Last ${periodDays} days`}
                accentColor={CYAN}
              />
              <MetricCard
                icon={<Activity size={18} />}
                label="Resolution Rate"
                value={fmtPct(metrics?.resolutionRate)}
                trendLabel={(metrics?.resolutionRate ?? 0) >= 85 ? "Above target" : "Below 85% target"}
                trend={(metrics?.resolutionRate ?? 0) >= 85 ? "up" : "down"}
                accentColor={GREEN}
              />
              <MetricCard
                icon={<Bot size={18} />}
                label="AI Deflection Rate"
                value={fmtPct(metrics?.aiDeflectionRate)}
                sub={`${metrics?.aiDeflectionCount ?? 0} tickets deflected`}
                trendLabel="vs 65% target"
                trend={(metrics?.aiDeflectionRate ?? 0) >= 65 ? "up" : "neutral"}
                accentColor={PURPLE}
              />
              <MetricCard
                icon={<Clock size={18} />}
                label="Avg Handle Time"
                value={`${fmt(metrics?.avgHandleTimeMinutes, 1)} min`}
                sub="Target: 8 min (AI)"
                trendLabel={(metrics?.avgHandleTimeMinutes ?? 99) <= 10 ? "At AI target" : "Above target"}
                trend={(metrics?.avgHandleTimeMinutes ?? 99) <= 10 ? "up" : "down"}
                accentColor={AMBER}
              />
              <MetricCard
                icon={<DollarSign size={18} />}
                label="Estimated Savings"
                value={fmtCurrency(metrics?.estimatedCostSavings)}
                sub="vs manual processing"
                trendLabel="Cost avoidance"
                trend="up"
                accentColor={GREEN}
              />
              <MetricCard
                icon={<Zap size={18} />}
                label="Hours Freed"
                value={`${fmt(metrics?.hoursFreed, 1)} hrs`}
                sub="AI automation savings"
                trend="up"
                trendLabel="Productivity gain"
                accentColor={CYAN}
              />
              <MetricCard
                icon={<Shield size={18} />}
                label="Uptime SLA"
                value={`${metrics?.uptimePct ?? 99.9}%`}
                sub="gigitekai.com"
                trendLabel="SLA: 99.9%"
                trend="up"
                accentColor={GREEN}
              />
              <MetricCard
                icon={<Star size={18} />}
                label="Call Quality Score"
                value={
                  metrics?.avgCallQualityScore != null
                    ? `${fmt(metrics.avgCallQualityScore, 1)}/100`
                    : "No data"
                }
                sub="AI-scored calls"
                accentColor={AMBER}
              />
              <MetricCard
                icon={<Phone size={18} />}
                label="Total Calls"
                value={fmt(metrics?.totalCalls)}
                sub={`+ ${metrics?.voicemailCount ?? 0} voicemails`}
                accentColor={PURPLE}
              />
              <MetricCard
                icon={<BookOpen size={18} />}
                label="KB Articles"
                value={fmt(metrics?.kbArticlesCreated)}
                sub="Created this period"
                accentColor={CYAN}
              />
            </div>

            {/* ── Charts Row ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "28px",
              }}
            >
              {/* Ticket Volume Chart */}
              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  padding: "20px 24px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 4px",
                  }}
                >
                  Ticket Volume — 6-Month Trend
                </h3>
                <p style={{ color: "#64748B", fontSize: "12px", margin: "0 0 16px" }}>
                  Total vs resolved tickets per month
                </p>
                {historyLoading ? (
                  <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                    Loading…
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={ticketChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: "#94A3B8", fontSize: "12px" }} />
                      <Bar dataKey="Total Tickets" fill={`${CYAN}80`} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Resolved" fill={`${GREEN}80`} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Savings Chart */}
              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  padding: "20px 24px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 4px",
                  }}
                >
                  Cost Savings & Hours Freed
                </h3>
                <p style={{ color: "#64748B", fontSize: "12px", margin: "0 0 16px" }}>
                  Estimated cost avoidance vs productivity hours freed
                </p>
                {historyLoading ? (
                  <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                    Loading…
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={savingsChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: "#94A3B8", fontSize: "12px" }} />
                      <Line
                        type="monotone"
                        dataKey="Savings ($)"
                        stroke={PURPLE}
                        strokeWidth={2}
                        dot={{ fill: PURPLE, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Hours Freed"
                        stroke={AMBER}
                        strokeWidth={2}
                        dot={{ fill: AMBER, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Benchmark + Value Drivers ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Target size={16} style={{ color: CYAN }} />
                  Forrester Benchmark Comparison
                </h3>
                <BenchmarkRow
                  label="Resolution Rate"
                  yourValue={metrics?.resolutionRate ?? 0}
                  benchmark={85}
                  unit="%"
                  higherIsBetter
                />
                <BenchmarkRow
                  label="AI Deflection Rate"
                  yourValue={metrics?.aiDeflectionRate ?? 0}
                  benchmark={65}
                  unit="%"
                  higherIsBetter
                />
                <BenchmarkRow
                  label="Uptime SLA"
                  yourValue={metrics?.uptimePct ?? 99.9}
                  benchmark={99.9}
                  unit="%"
                  higherIsBetter
                />
                <BenchmarkRow
                  label="Avg Handle Time"
                  yourValue={metrics?.avgHandleTimeMinutes ?? 22}
                  benchmark={22}
                  unit=" min"
                  higherIsBetter={false}
                />
              </div>

              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    margin: "0 0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <TrendingUp size={16} style={{ color: GREEN }} />
                  5 Forrester TEI Value Drivers
                </h3>
                {[
                  { driver: "Ticket Deflection", impact: `${fmtPct(metrics?.aiDeflectionRate)} AI-resolved`, color: PURPLE, icon: <Bot size={14} /> },
                  { driver: "AHT Reduction", impact: `${fmt(metrics?.avgHandleTimeMinutes, 1)} min avg (target 8)`, color: AMBER, icon: <Clock size={14} /> },
                  { driver: "Cost Avoidance", impact: fmtCurrency(metrics?.estimatedCostSavings), color: GREEN, icon: <DollarSign size={14} /> },
                  { driver: "Productivity Freed", impact: `${fmt(metrics?.hoursFreed, 1)} hrs this period`, color: CYAN, icon: <Zap size={14} /> },
                  { driver: "Uptime Assurance", impact: `${metrics?.uptimePct ?? 99.9}% SLA maintained`, color: GREEN, icon: <Shield size={14} /> },
                ].map((item) => (
                  <div
                    key={item.driver}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 0",
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    <div
                      style={{
                        color: item.color,
                        background: `${item.color}15`,
                        borderRadius: "6px",
                        padding: "6px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, color: "#CBD5E1", fontSize: "13px", fontWeight: 600 }}>
                      {item.driver}
                    </div>
                    <div style={{ color: item.color, fontSize: "13px", fontWeight: 700 }}>
                      {item.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Ticket Source Breakdown ── */}
            <div
              style={{
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#F1F5F9",
                  margin: "0 0 16px",
                }}
              >
                Ticket Source Breakdown
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "12px",
                }}
              >
                {[
                  { label: "Email Tickets", value: metrics?.emailTickets ?? 0, color: CYAN },
                  { label: "Phone/Call Tickets", value: metrics?.phoneTickets ?? 0, color: AMBER },
                  { label: "AI Deflected", value: metrics?.aiDeflectionCount ?? 0, color: PURPLE },
                  { label: "Resolved", value: metrics?.resolvedCount ?? 0, color: GREEN },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: `${item.color}08`,
                      border: `1px solid ${item.color}30`,
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Space Grotesk, sans-serif",
                        fontSize: "28px",
                        fontWeight: 700,
                        color: item.color,
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
