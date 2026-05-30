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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const AUDIT_CATEGORIES = [
  {
    id: "backup-recovery",
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
    id: "disaster-recovery",
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
    id: "cloud-infrastructure",
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
    id: "email-security",
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
    id: "identity-management",
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
    description: "Assess your organization's IT resilience, FIPA compliance, and disaster recovery readiness.",
  });

  const totalQuestions = AUDIT_CATEGORIES.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.keys(scores).length;
  const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const scoreBand = SCORE_BANDS.find(
    (band) => percentage >= band.min && percentage <= band.max
  );

  // tRPC mutation for sending scorecard
  const sendScorecard = trpc.emailDrip.sendDripSequence.useMutation({
    onSuccess: () => {
      toast.success("Scorecard submitted! Your personalized report is being sent to your email.");
      setSubmitted(true);
      setScores({});
      setEmail("");
      setName("");
      setCompanyName("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit scorecard. Please try again.");
      console.error("[Scorecard] Submit error:", error);
    },
  });

  const handleScoreChange = (categoryId: string, questionIndex: number, value: number) => {
    setScores((prev) => ({
      ...prev,
      [`${categoryId}-${questionIndex}`]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !companyName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (answeredQuestions === 0) {
      toast.error("Please answer at least one question");
      return;
    }

    setIsLoading(true);
    try {
      // Calculate individual category scores
      const categoryScores = AUDIT_CATEGORIES.reduce((acc, category) => {
        const categoryQuestionScores = category.questions.map((_, idx) => scores[`${category.id}-${idx}`] || 0);
        const categoryTotal = categoryQuestionScores.reduce((sum, v) => sum + v, 0);
        const categoryPercentage = (categoryTotal / (category.questions.length * 5)) * 100;
        acc[category.id] = { title: category.title, percentage: Math.round(categoryPercentage) };
        return acc;
      }, {} as Record<string, { title: string; percentage: number }>);

      // Split name into first and last
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "User";

      // Call tRPC mutation with correct payload
      await sendScorecard.mutateAsync({
        email,
        firstName,
        lastName,
        companyName,
        emailSecurityScore: categoryScores["email-security"]?.percentage || 0,
        endpointProtectionScore: 0, // Not in current categories, set to 0
        backupRecoveryScore: categoryScores["backup-recovery"]?.percentage || 0,
        identityManagementScore: categoryScores["identity-management"]?.percentage || 0,
        complianceScore: categoryScores["disaster-recovery"]?.percentage || 0,
        overallScore: percentage,
        riskLevel: scoreBand?.label || "Unknown",
      });
    } catch (error) {
      console.error("[Scorecard] Error:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNavBar2024 />
        <main className="flex-1 container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Scorecard Submitted!</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your personalized IT compliance report has been sent to <strong>{email}</strong>
            </p>
            <p className="text-muted-foreground mb-8">
              Check your email for your detailed assessment, remediation roadmap, and exclusive Switch Program offer.
            </p>
            <Link href="/">
              <a className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
                Back to Home <ArrowRight className="w-4 h-4" />
              </a>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavBar2024 />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-400 mb-6">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
              </a>
            </Link>
            <h1 className="text-4xl font-bold mb-4">
              IT Compliance <span className="text-cyan-500">Scorecard</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Assess your organization's IT resiliency, FIPA compliance, and disaster recovery readiness. Get personalized recommendations based on your score.
            </p>
          </div>

          {/* Progress */}
          <div className="bg-card rounded-lg p-6 mb-8 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Progress</h3>
              <span className="text-2xl font-bold text-cyan-500">{percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {answeredQuestions} of {totalQuestions} questions answered
            </p>
          </div>

          {/* Scoring Legend */}
          <div className="bg-card rounded-lg p-6 mb-8 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-cyan-500">How to Rate Each Control</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {RATING_SCALE.map((scale) => (
                <div key={scale.value} className="text-center">
                  <button
                    type="button"
                    className="w-12 h-12 rounded-lg font-bold text-white mx-auto mb-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: scale.color }}
                    title={`${scale.value}: ${scale.label} - ${scale.description}`}
                  >
                    {scale.value}
                  </button>
                  <p className="text-xs font-semibold">{scale.label}</p>
                  <p className="text-xs text-muted-foreground">{scale.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {AUDIT_CATEGORIES.map((category) => (
              <div key={category.id} className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4 text-cyan-500">{category.title}</h3>
                <div className="space-y-4">
                  {category.questions.map((question, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">{question}</p>
                        <div className="flex gap-2">
                          {RATING_SCALE.map((scale) => (
                            <button
                              key={scale.value}
                              type="button"
                              onClick={() => handleScoreChange(category.id, idx, scale.value)}
                              className={`w-10 h-10 rounded font-bold transition-all ${
                                scores[`${category.id}-${idx}`] === scale.value
                                  ? "ring-2 ring-offset-2 ring-offset-background"
                                  : "opacity-50 hover:opacity-75"
                              }`}
                              style={{
                                backgroundColor: scale.color,
                                color: "white",
                              }}
                              title={scale.label}
                            >
                              {scale.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Contact Info */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4 text-cyan-500">Get Your Personalized Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Harry Henry-Santiago"
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="harry@gigitekai.com"
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || sendScorecard.isPending}
                className="w-full mt-6 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading || sendScorecard.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send My Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
