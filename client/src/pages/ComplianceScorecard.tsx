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
    id: "security",
    title: "Email Security & Compliance",
    weight: 1,
    questions: [
      "Email encryption (TLS, S/MIME)",
      "DLP policies enforced",
      "Advanced threat protection (ATP)",
      "Phishing & malware detection",
      "Email audit logs retained (≥1 year)",
    ],
  },
  {
    id: "identity",
    title: "Identity & Access Management",
    weight: 1.1,
    questions: [
      "MFA enforced for all users",
      "Conditional access policies",
      "Privileged access management (PAM)",
      "Regular access reviews (quarterly)",
      "Password policy enforced (14+ chars, complexity)",
    ],
  },
];

const SCORE_BANDS = [
  { min: 0, max: 39, label: "Critical", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)" },
  { min: 40, max: 59, label: "At Risk", color: "#F97316", bgColor: "rgba(249, 115, 22, 0.1)" },
  { min: 60, max: 79, label: "Good", color: "#EAB308", bgColor: "rgba(234, 179, 8, 0.1)" },
  { min: 80, max: 100, label: "Excellent", color: "#22C55E", bgColor: "rgba(34, 197, 94, 0.1)" },
];

export default function ComplianceScorecard() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Calculate individual category scores
  const calculateCategoryScore = (catId: string) => {
    const catScores = Object.entries(scores)
      .filter(([key]) => key.startsWith(catId))
      .map(([, val]) => val);
    return catScores.length > 0 ? Math.round((catScores.reduce((a, b) => a + b, 0) / catScores.length) * 100) / 100 : 0;
  };

  // Determine risk level
  const getRiskLevel = (score: number) => {
    if (score >= 80) return "Low";
    if (score >= 60) return "Medium";
    if (score >= 40) return "High";
    return "Critical";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || answeredQuestions === 0) return;

    setIsLoading(true);
    try {
      // Calculate individual category scores
      const backupRecoveryScore = calculateCategoryScore("backup");
      const drpScore = calculateCategoryScore("drp");
      const cloudScore = calculateCategoryScore("cloud");
      const emailSecurityScore = calculateCategoryScore("security");
      const identityManagementScore = calculateCategoryScore("identity");

      // Average of all categories for overall score
      const overallScore = percentage;
      const riskLevel = getRiskLevel(percentage);

      // Parse first and last name
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(" ") || "";

      // Call the emailDrip.sendDripSequence mutation with all scorecard data
      const response = await fetch("/api/trpc/emailDrip.sendDripSequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            email,
            firstName,
            lastName,
            companyName: companyName || "Your Organization",
            emailSecurityScore,
            endpointProtectionScore: 0, // Not in current scorecard, can be added later
            backupRecoveryScore,
            identityManagementScore,
            complianceScore: drpScore,
            overallScore,
            riskLevel,
          },
        }),
      });

      const result = await response.json();
      if (!result.result?.data?.success) {
        throw new Error(result.result?.error?.message || "Failed to send scorecard");
      }

      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setName("");
        setCompanyName("");
        setScores({});
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("[Scorecard] Error:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Failed to send scorecard"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-32 pb-12 px-4 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors">
                <ArrowRight size={18} className="rotate-180" />
                <span>Back to Home</span>
              </Link>
            </div>

            <h1 className="text-5xl font-bold mb-4 text-white">
              IT Compliance <span className="text-[#00D4FF]">Scorecard</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Assess your organization's IT resiliency, FIPA compliance, and disaster recovery readiness. Get personalized recommendations based on your score.
            </p>

            {/* Progress */}
            <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-lg border border-white/10 w-fit">
              <TrendingUp size={20} className="text-[#00D4FF]" />
              <span className="text-lg">
                <span className="text-[#00D4FF] font-bold">{answeredQuestions}</span> of{" "}
                <span className="text-gray-400">{totalQuestions} questions answered</span>
              </span>
            </div>
          </div>
        </section>

        {/* Scorecard Form */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Current Score Display */}
            {answeredQuestions > 0 && (
              <div
                className="mb-12 p-8 rounded-lg border border-white/10"
                style={{ backgroundColor: scoreBand?.bgColor }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-300 mb-2">Your Current Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-bold" style={{ color: scoreBand?.color }}>
                        {percentage}
                      </span>
                      <span className="text-2xl text-gray-400">/100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-2">Risk Level</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: scoreBand?.color }}
                    >
                      {scoreBand?.label}
                    </p>
                    {scoreBand?.label === "Critical" && (
                      <p className="text-sm text-red-400 mt-2">Vulnerable; immediate intervention</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${percentage}%`, backgroundColor: scoreBand?.color }}
                  />
                </div>
              </div>
            )}

            {/* Audit Questions */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {AUDIT_CATEGORIES.map((category) => (
                <div key={category.id} className="p-6 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-xl font-bold text-[#00D4FF] mb-6">{category.title}</h3>

                  <div className="space-y-6">
                    {category.questions.map((question, idx) => (
                      <div key={idx}>
                        <p className="text-gray-300 mb-3">{question}</p>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleScore(category.id, idx, value)}
                              className={`w-10 h-10 rounded border transition-all ${
                                scores[`${category.id}-${idx}`] === value
                                  ? "bg-[#00D4FF] border-[#00D4FF] text-black font-bold"
                                  : "border-white/20 text-gray-400 hover:border-[#00D4FF]"
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Submission Form */}
              {answeredQuestions === totalQuestions && (
                <div className="p-8 bg-gradient-to-r from-[#00D4FF]/10 to-transparent rounded-lg border border-[#00D4FF]/30">
                  <h3 className="text-xl font-bold mb-6 text-white">Get Your Personalized Roadmap</h3>

                  <div className="space-y-4 mb-6">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                    />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-[#00D4FF] text-black font-bold rounded hover:bg-[#00D4FF]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin">⏳</div>
                        Sending Report...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Check Your Email
                      </>
                    )}
                  </button>

                  {submitted && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-500" />
                      <p className="text-green-400">
                        ✓ Scorecard report sent! Check your email for your personalized roadmap.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-white/5 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Close the Gaps?</h2>
            <p className="text-gray-300 mb-8">
              GigitekAI's 60-Day Migration Guarantee covers all remediation and implementation. We'll bring your score to 85+ in 60 days or less.
            </p>
            <Link href="/switch-program" className="inline-block px-8 py-3 bg-[#00D4FF] text-black font-bold rounded hover:bg-[#00D4FF]/90 transition-all">
              Learn About The Switch Program →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
