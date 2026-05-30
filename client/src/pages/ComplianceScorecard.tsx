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

const RATING_SCALE = [
  { value: 1, label: "Not Implemented", description: "No controls in place; critical gap", color: "#EF4444" },
  { value: 2, label: "Partially Implemented", description: "Limited coverage; significant gaps remain", color: "#F97316" },
  { value: 3, label: "Mostly Implemented", description: "Adequate coverage; minor gaps", color: "#EAB308" },
  { value: 4, label: "Fully Implemented", description: "Strong coverage; meets requirements", color: "#84CC16" },
  { value: 5, label: "Optimized", description: "Fully implemented + continuously improved", color: "#22C55E" },
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
  const maxScore = answeredQuestions * 5;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const scoreBand = SCORE_BANDS.find((band) => percentage >= band.min && percentage <= band.max);

  const handleScore = (categoryId: string, questionIdx: number, value: number) => {
    setScores({
      ...scores,
      [`${categoryId}-${questionIdx}`]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !companyName) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const categoryScores = AUDIT_CATEGORIES.reduce((acc, category) => {
        const categoryQuestionScores = category.questions.map((_, idx) => scores[`${category.id}-${idx}`] || 0);
        const categoryTotal = categoryQuestionScores.reduce((sum, v) => sum + v, 0);
        const categoryPercentage = (categoryTotal / (category.questions.length * 5)) * 100;
        acc[category.id] = { title: category.title, percentage: Math.round(categoryPercentage) };
        return acc;
      }, {} as Record<string, { title: string; percentage: number }>);

      const response = await fetch("/api/trpc/emailDrip.sendDripSequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            email,
            firstName: name,
            companyName,
            overallScore: percentage,
            riskLevel: scoreBand?.label || "Unknown",
            categoryScores,
            totalQuestions,
            answeredQuestions,
          },
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setScores({});
        setEmail("");
        setName("");
        setCompanyName("");
      } else {
        alert("Failed to submit scorecard. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting scorecard:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] text-white">
        <SiteNavBar2024 />
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle size={64} className="mx-auto mb-6 text-[#22C55E]" />
            <h2 className="text-4xl font-bold mb-4">Scorecard Submitted!</h2>
            <p className="text-xl text-gray-300 mb-8">
              Your personalized compliance report has been sent to <span className="text-[#00D4FF]">{email}</span>
            </p>
            <p className="text-gray-400 mb-8">
              Check your email for your detailed roadmap, compliance framework analysis, and next steps.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-8 py-3 bg-[#00D4FF] text-black font-bold rounded hover:bg-cyan-400 transition"
            >
              Take Another Assessment
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SiteNavBar2024 />

      {/* Hero Section */}
      <section className="py-16 px-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-cyan-400 transition">
                <ArrowRight size={18} className="rotate-180" />
                <span>Back to Home</span>
              </a>
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

          {/* Scoring Legend */}
          <div className="mb-12 p-6 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-bold text-[#00D4FF] mb-6">How to Rate Each Control</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {RATING_SCALE.map((rating) => (
                <div
                  key={rating.value}
                  className="p-4 rounded border border-white/10 hover:border-white/30 transition"
                  style={{ borderLeftColor: rating.color, borderLeftWidth: "4px" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: rating.color }}
                    >
                      {rating.value}
                    </div>
                    <span className="font-bold text-sm">{rating.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{rating.description}</p>
                </div>
              ))}
            </div>
          </div>

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
                        {RATING_SCALE.map((rating) => (
                          <button
                            key={rating.value}
                            type="button"
                            onClick={() => handleScore(category.id, idx, rating.value)}
                            className="relative group"
                            title={`${rating.value}: ${rating.label} - ${rating.description}`}
                          >
                            <div
                              className={`w-10 h-10 rounded border transition-all ${
                                scores[`${category.id}-${idx}`] === rating.value
                                  ? "border-2 text-white font-bold"
                                  : "border-white/20 text-gray-400 hover:border-white/50"
                              }`}
                              style={{
                                backgroundColor: scores[`${category.id}-${idx}`] === rating.value ? rating.color : "transparent",
                                borderColor: scores[`${category.id}-${idx}`] === rating.value ? rating.color : undefined,
                              }}
                            >
                              {rating.value}
                            </div>
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 border border-white/20 rounded px-3 py-2 text-xs whitespace-nowrap">
                                <p className="font-bold" style={{ color: rating.color }}>{rating.label}</p>
                                <p className="text-gray-300">{rating.description}</p>
                              </div>
                            </div>
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
              <div className="p-6 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold text-[#00D4FF] mb-6">Get Your Personalized Report</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-[#00D4FF] text-black font-bold rounded hover:bg-cyan-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    {isLoading ? "Sending..." : "Send My Report"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
