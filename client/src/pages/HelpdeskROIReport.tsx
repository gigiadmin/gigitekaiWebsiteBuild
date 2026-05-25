/**
 * HelpdeskROIReport — Phase D
 * Client-facing ROI report page. Shows value delivered by GigitekAI
 * in a clean, professional format suitable for client presentations.
 *
 * Design: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
 * Fonts: Space Grotesk (display) + DM Sans (body)
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  CheckCircle,
  Clock,
  Ticket,
  Bot,
  DollarSign,
  Shield,
  Star,
  Phone,
  ChevronLeft,
  TrendingUp,
  Zap,
  Award,
  ExternalLink,
} from "lucide-react";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const CYAN = "#00D4FF";
const NAVY = "#0A0E1A";
const CARD_BG = "#0D1526";
const BORDER = "#1A2540";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const PURPLE = "#8B5CF6";

// ── Value Card ────────────────────────────────────────────────────────────────
function ValueCard({
  icon,
  label,
  value,
  description,
  accentColor = CYAN,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          color: accentColor,
          background: `${accentColor}15`,
          borderRadius: "10px",
          padding: "10px",
          display: "inline-flex",
          alignItems: "center",
          width: "fit-content",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "36px",
          fontWeight: 800,
          color: accentColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div>
        <div
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            color: "#F1F5F9",
            marginBottom: "4px",
          }}
        >
          {label}
        </div>
        <div style={{ color: "#64748B", fontSize: "13px", fontFamily: "DM Sans, sans-serif" }}>
          {description}
        </div>
      </div>
    </div>
  );
}

// ── SLA Badge ─────────────────────────────────────────────────────────────────
function SLABadge({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        background: met ? `${GREEN}10` : `${AMBER}10`,
        border: `1px solid ${met ? GREEN : AMBER}30`,
        borderRadius: "8px",
      }}
    >
      <CheckCircle
        size={16}
        style={{ color: met ? GREEN : AMBER, flexShrink: 0 }}
      />
      <span
        style={{
          color: "#CBD5E1",
          fontSize: "13px",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {label}
      </span>
      <span
        style={{
          marginLeft: "auto",
          color: met ? GREEN : AMBER,
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: "Space Grotesk, sans-serif",
        }}
      >
        {met ? "✓ MET" : "IN PROGRESS"}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HelpdeskROIReport() {
  const [periodDays] = useState(30);

  const { data, isLoading } = trpc.roiMetrics.getClientSummary.useQuery({ periodDays });

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
          <Link href="/helpdesk">
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
              <ChevronLeft size={14} /> Support Portal
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
                Your IT ROI Report
              </h1>
              <p style={{ color: "#64748B", fontSize: "12px", margin: 0 }}>
                {data?.period ?? "Last 30 days"} · Powered by GigitekAI
              </p>
            </div>
          </div>
        </div>

        <a
          href="https://gigitekai.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: CYAN,
            fontSize: "13px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          gigitekai.com <ExternalLink size={12} />
        </a>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
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
            <TrendingUp size={20} /> Loading your report…
          </div>
        ) : (
          <>
            {/* ── Hero Banner ── */}
            <div
              style={{
                background: `linear-gradient(135deg, ${CYAN}15, ${PURPLE}10)`,
                border: `1px solid ${CYAN}30`,
                borderRadius: "16px",
                padding: "32px",
                marginBottom: "32px",
                display: "flex",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  background: `${CYAN}20`,
                  borderRadius: "12px",
                  padding: "16px",
                  color: CYAN,
                }}
              >
                <Award size={32} />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h2
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#F1F5F9",
                    margin: "0 0 8px",
                  }}
                >
                  GigitekAI Delivered Real Value This Month
                </h2>
                <p
                  style={{
                    color: "#94A3B8",
                    fontSize: "14px",
                    margin: 0,
                    fontFamily: "DM Sans, sans-serif",
                    maxWidth: "600px",
                  }}
                >
                  Your AI-powered IT support handled{" "}
                  <strong style={{ color: CYAN }}>{data?.ticketsHandled ?? 0} tickets</strong>,
                  freed{" "}
                  <strong style={{ color: GREEN }}>
                    {fmt(data?.hoursFreed, 1)} hours
                  </strong>{" "}
                  of productivity, and delivered an estimated{" "}
                  <strong style={{ color: PURPLE }}>
                    {fmtCurrency(data?.estimatedSavings)}
                  </strong>{" "}
                  in cost savings.
                </p>
              </div>
              <div
                style={{
                  background: `${GREEN}15`,
                  border: `1px solid ${GREEN}30`,
                  borderRadius: "12px",
                  padding: "16px 24px",
                  textAlign: "center",
                  minWidth: "140px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "36px",
                    fontWeight: 800,
                    color: GREEN,
                  }}
                >
                  {fmtPct(data?.resolutionRate)}
                </div>
                <div style={{ color: "#64748B", fontSize: "12px" }}>Resolution Rate</div>
              </div>
            </div>

            {/* ── Value Cards Grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <ValueCard
                icon={<Ticket size={20} />}
                label="Tickets Handled"
                value={String(data?.ticketsHandled ?? 0)}
                description="Total support requests processed this period"
                accentColor={CYAN}
              />
              <ValueCard
                icon={<Bot size={20} />}
                label="AI Deflection Rate"
                value={fmtPct(data?.aiDeflectionRate)}
                description="Tickets resolved by AI without human escalation"
                accentColor={PURPLE}
              />
              <ValueCard
                icon={<Clock size={20} />}
                label="Avg Response Time"
                value={`${fmt(data?.avgResponseTimeMinutes, 1)} min`}
                description="Average time to handle and resolve a ticket"
                accentColor={AMBER}
              />
              <ValueCard
                icon={<DollarSign size={20} />}
                label="Estimated Savings"
                value={fmtCurrency(data?.estimatedSavings)}
                description="Cost avoidance vs. traditional manual support"
                accentColor={GREEN}
              />
              <ValueCard
                icon={<Zap size={20} />}
                label="Hours Freed"
                value={`${fmt(data?.hoursFreed, 1)} hrs`}
                description="Productivity hours returned to your team"
                accentColor={CYAN}
              />
              <ValueCard
                icon={<Shield size={20} />}
                label="Uptime SLA"
                value={`${data?.uptimeSLA ?? 99.9}%`}
                description="System availability guaranteed by GigitekAI"
                accentColor={GREEN}
              />
              {data?.callQualityScore != null && (
                <ValueCard
                  icon={<Star size={20} />}
                  label="Call Quality Score"
                  value={`${fmt(data.callQualityScore, 1)}/100`}
                  description="AI-evaluated support call quality average"
                  accentColor={AMBER}
                />
              )}
              <ValueCard
                icon={<Phone size={20} />}
                label="Total Calls"
                value={String(data?.totalCalls ?? 0)}
                description="Phone support interactions this period"
                accentColor={PURPLE}
              />
            </div>

            {/* ── SLA Commitments ── */}
            <div
              style={{
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "32px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#F1F5F9",
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Shield size={16} style={{ color: GREEN }} />
                SLA Commitments — This Period
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <SLABadge
                  met={(data?.uptimeSLA ?? 0) >= 99.9}
                  label={`99.9% Uptime SLA — Current: ${data?.uptimeSLA ?? 99.9}%`}
                />
                <SLABadge
                  met={(data?.resolutionRate ?? 0) >= 85}
                  label={`85%+ Resolution Rate — Current: ${fmtPct(data?.resolutionRate)}`}
                />
                <SLABadge
                  met={(data?.aiDeflectionRate ?? 0) >= 50}
                  label={`50%+ AI Deflection — Current: ${fmtPct(data?.aiDeflectionRate)}`}
                />
                <SLABadge
                  met={(data?.avgResponseTimeMinutes ?? 999) <= 15}
                  label={`≤15 min Avg Response — Current: ${fmt(data?.avgResponseTimeMinutes, 1)} min`}
                />
              </div>
            </div>

            {/* ── Footer CTA ── */}
            <div
              style={{
                background: `linear-gradient(135deg, ${NAVY}, #0F1A2E)`,
                border: `1px solid ${BORDER}`,
                borderRadius: "12px",
                padding: "28px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#F1F5F9",
                    marginBottom: "6px",
                  }}
                >
                  Want to see deeper analytics?
                </div>
                <div style={{ color: "#64748B", fontSize: "13px" }}>
                  Contact your GigitekAI account manager for a full Forrester TEI analysis.
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href="mailto:support@gigitek.com"
                  style={{
                    padding: "10px 20px",
                    background: `${CYAN}20`,
                    border: `1px solid ${CYAN}40`,
                    borderRadius: "8px",
                    color: CYAN,
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Contact Us
                </a>
                <a
                  href="https://gigitekai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 20px",
                    background: CYAN,
                    borderRadius: "8px",
                    color: NAVY,
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Learn More <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* ── Powered by footer ── */}
            <div
              style={{
                textAlign: "center",
                marginTop: "24px",
                color: "#334155",
                fontSize: "12px",
              }}
            >
              Powered by{" "}
              <a
                href="https://gigitekai.com"
                style={{ color: CYAN, textDecoration: "none" }}
              >
                GigitekAI
              </a>{" "}
              · AI-First MSP · 99.9% Uptime SLA · (727) 382-6909
            </div>
          </>
        )}
      </div>
    </div>
  );
}
