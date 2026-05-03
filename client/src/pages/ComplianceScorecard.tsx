/*
  Compliance Scorecard Dashboard
  Slug: /compliance-scorecard
  Interactive audit scoring tool with personalized recommendations
*/

import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle, AlertTriangle, TrendingUp, Download, Mail } from "lucide-react";
import { Link } from "wouter";

const AUDIT_CATEGORIES = [
  {
    id: "backup",
    title: "Backup & Recovery Infrastructure",
    weight: 1,
    questions: [
      "Offsite backups to geographically separate cloud region",
      "RTO ≤ 4 hours for critical systems",
      "RPO ≤ 1 hour for transactional data",
      "Monthly restore tests documented",
      "Backups encrypted (AES-256)",
    ],
  },
  {
    id: "drp",
    title: "Disaster Recovery Plan",
    weight: 1,
    questions: [
      "Written DRP reviewed by leadership",
      "Emergency contact tree maintained",
      "Failover procedures documented",
      "Communication plan pre-approved",
      "Annual DRP simulation conducted",
    ],
  },
  {
    id: "cloud",
    title: "Cloud & Sovereign Infrastructure",
    weight: 1.2,
    questions: [
      "Multi-region deployment (≥2 regions)",
      "Sovereign cloud compliance (FIPA/state residency)",
      "Automatic failover on outage",
      "Real-time database replication (<1 sec lag)",
      "Geographic load balancing",
    ],
  },
  {
    id: "physical",
    title: "Physical Security & Facilities",
    weight: 1,
    questions: [
      "UPS + generator (≥8 hour runtime)",
      "Dual internet connections",
      "Badge-controlled server room",
      "Environmental monitoring & alerts",
      "Fire suppression system (non-water)",
    ],
  },
  {
    id: "security",
    title: "Cybersecurity & Data Protection",
    weight: 1.2,
    questions: [
      "Zero Trust with MFA on all remote access",
      "TLS 1.2+ for all communications",
      "AES-256 encryption at rest",
      "Role-based access control (RBAC)",
      "Centralized logging (12-month retention)",
    ],
  },
  {
    id: "compliance",
    title: "Compliance & Regulatory",
    weight: 1.3,
    questions: [
      "FIPA compliance (Florida data residency)",
      "HIPAA/PCI/SOC 2 certifications current",
      "Data retention policy documented",
      "Incident response plan written",
      "Annual third-party compliance audit",
    ],
  },
  {
    id: "bc",
    title: "Business Continuity Operations",
    weight: 1,
    questions: [
      "100% remote work capability",
      "Redundant communication tools",
      "All critical documents cloud-accessible",
      "Vendor continuity & SLA guarantees",
      "Quarterly BC drills documented",
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring & Alerting",
    weight: 1.1,
    questions: [
      "24/7 monitoring of critical systems",
      "Automated alert escalation",
      "Performance baselines established",
      "AI-powered anomaly detection",
      "Documented response SLAs",
    ],
  },
  {
    id: "ai",
    title: "AI & Automation Readiness",
    weight: 1.4,
    questions: [
      "AI agents handling routine tasks",
      "Automated failover without manual intervention",
      "ML models predicting failures",
      "Self-healing infrastructure",
      "System learning from past incidents",
    ],
  },
  {
    id: "hurricane",
    title: "Hurricane Season Preparedness",
    weight: 1.2,
    questions: [
      "Pre-hurricane seasonal checklist",
      "Backup generator fuel verified",
      "Dual carriers confirmed operational",
      "Staff trained on emergency procedures",
      "Critical hardware/software pre-positioned",
    ],
  },
];

const SCORE_BANDS = [
  { min: 90, max: 100, label: "Excellent", color: "#00D4FF", desc: "Highly resilient and prepared" },
  { min: 70, max: 89, label: "Good", color: "#7c3aed", desc: "Minor gaps; address within 90 days" },
  { min: 50, max: 69, label: "At Risk", color: "#f59e0b", desc: "Multiple vulnerabilities; urgent action" },
  { min: 0, max: 49, label: "Critical", color: "#ef4444", desc: "Vulnerable; immediate intervention" },
];

export default function ComplianceScorecard() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useSEO({
    title: "IT Compliance Scorecard | GigitekAI",
    description: "Interactive audit tool to assess your IT resiliency, FIPA compliance, and disaster recovery readiness. Get personalized recommendations.",
    path: "/compliance-scorecard",
  });

  const totalQuestions = AUDIT_CATEGORIES.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.values(scores).filter((v) => v !== undefined).length;
  const totalScore = Object.values(scores).reduce((sum, v) => (v !== undefined ? sum + v : sum), 0);
  const maxScore = totalQuestions * 5;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const scoreBand = SCORE_BANDS.find((b) => percentage >= b.min && percentage <= b.max);

  const handleScore = (catId: string, qIdx: number, value: number) => {
    const key = `${catId}-${qIdx}`;
    setScores({ ...scores, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    try {
      await fetch("/api/trpc/contact.submitContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: "Not provided",
          message: `Compliance Scorecard submitted - Score: ${percentage}/100 (${scoreBand?.label || "Unknown"})`,
          source: "compliance-scorecard",
        }),
      });

      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setName("");
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-32 pb-12 px-4 border-b border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              IT Compliance <span className="text-[#00D4FF]">Scorecard</span>
            </h1>
            <p className="text-gray-400 text-lg mb-6 max-w-2xl mx-auto">
              Assess your organization's IT resiliency, FIPA compliance, and disaster recovery readiness. Get personalized recommendations based on your score.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-4 py-2">
              <TrendingUp size={16} className="text-[#00D4FF]" />
              <span className="text-sm text-[#00D4FF]">
                {answeredQuestions} of {totalQuestions} questions answered
              </span>
            </div>
          </div>
        </section>

        {/* Scorecard */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Score Progress */}
            {answeredQuestions > 0 && (
              <div className="mb-12 p-6 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Your Current Score</h3>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-[#00D4FF]">{percentage}</div>
                    <div className="text-sm text-gray-400">/100</div>
                  </div>
                </div>
                <div className="w-full bg-[#0D1528] rounded-full h-3 mb-4">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: scoreBand?.color || "#00D4FF",
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: scoreBand?.color || "#00D4FF" }}
                  />
                  <span className="font-semibold">{scoreBand?.label || "Unknown"}</span>
                  <span className="text-gray-400">— {scoreBand?.desc}</span>
                </div>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-8">
              {AUDIT_CATEGORIES.map((category) => (
                <div key={category.id} className="border border-white/5 rounded-xl p-6 bg-[#0D1528]/50">
                  <h3 className="text-lg font-bold mb-4 text-[#00D4FF]">{category.title}</h3>
                  <div className="space-y-3">
                    {category.questions.map((question, idx) => {
                      const key = `${category.id}-${idx}`;
                      const value = scores[key];
                      return (
                        <div key={key} className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="text-gray-300 mb-2">{question}</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                  key={score}
                                  onClick={() => handleScore(category.id, idx, score)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${ value === score
                                      ? "bg-[#00D4FF] text-[#0A0E1A]"
                                      : "bg-[#0A0E1A] border border-white/10 text-gray-400 hover:border-[#00D4FF]/50"
                                    }`}
                                >
                                  {score}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Results & CTA */}
            {answeredQuestions > 0 && (
              <div className="mt-12 p-6 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5">
                <h3 className="text-xl font-bold mb-4">Get Your Personalized Roadmap</h3>
                <p className="text-gray-300 mb-6">
                  Share your score and we'll send you a detailed remediation roadmap with prioritized actions for your organization.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#0A0E1A]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#0A0E1A]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-6 py-3 rounded-lg font-bold hover:bg-[#00D4FF]/90 transition-colors"
                  >
                    {submitted ? "✓ Check Your Email" : "Get My Roadmap"} <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Ready to Close the Gaps?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              GigitekAI's 60-Day Migration Guarantee covers all remediation and implementation. We'll bring your score to 85+ in 60 days or less.
            </p>
            <Link
              href="/switch-program"
              className="inline-flex items-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-8 py-3 rounded-lg font-bold hover:bg-[#00D4FF]/90 transition-colors"
            >
              Learn About The Switch Program <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
