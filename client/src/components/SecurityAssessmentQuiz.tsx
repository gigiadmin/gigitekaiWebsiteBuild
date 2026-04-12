/**
 * Cybersecurity Risk Assessment Quiz Component
 * 10-question interactive quiz with scoring and PDF report generation
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

type QuizStep = "intro" | "questions" | "results";

interface QuizState {
  email: string;
  companyName: string;
  firstName: string;
  lastName: string;
  phone: string;
  emailSecurityScore: number;
  endpointProtectionScore: number;
  backupRecoveryScore: number;
  identityManagementScore: number;
  complianceScore: number;
}

const INITIAL_STATE: QuizState = {
  email: "",
  companyName: "",
  firstName: "",
  lastName: "",
  phone: "",
  emailSecurityScore: 0,
  endpointProtectionScore: 0,
  backupRecoveryScore: 0,
  identityManagementScore: 0,
  complianceScore: 0,
};

const QUESTIONS = [
  {
    id: "emailSecurity",
    category: "Email Security",
    question: "How confident are you in your email security protections?",
    key: "emailSecurityScore" as const,
  },
  {
    id: "endpointProtection",
    category: "Endpoint Protection",
    question: "Are all your devices protected with modern endpoint security?",
    key: "endpointProtectionScore" as const,
  },
  {
    id: "backupRecovery",
    category: "Backup & Recovery",
    question: "Do you have a tested backup and disaster recovery plan?",
    key: "backupRecoveryScore" as const,
  },
  {
    id: "identityManagement",
    category: "Identity Management",
    question: "How strong is your identity and access management?",
    key: "identityManagementScore" as const,
  },
  {
    id: "compliance",
    category: "Compliance",
    question: "Are you meeting your industry compliance requirements?",
    key: "complianceScore" as const,
  },
];

export function SecurityAssessmentQuiz() {
  const [step, setStep] = useState<QuizStep>("intro");
  const [state, setState] = useState<QuizState>(INITIAL_STATE);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [results, setResults] = useState<any>(null);

  const submitMutation = trpc.leadgen.submitAssessment.useMutation();

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.email || !state.firstName || !state.lastName || !state.companyName) {
      alert("Please fill in all required fields");
      return;
    }
    setStep("questions");
  };

  const handleScoreSubmit = (score: number) => {
    const question = QUESTIONS[currentQuestion];
    setState((prev) => ({
      ...prev,
      [question.key]: score,
    }));

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(score);
    }
  };

  const submitQuiz = async (lastScore: number) => {
    try {
      const newState = {
        ...state,
        [QUESTIONS[currentQuestion].key]: lastScore,
      };

      const response = await submitMutation.mutateAsync(newState);
      setResults(response);
      setStep("results");
    } catch (error) {
      console.error("Quiz submission failed:", error);
      alert("Failed to submit assessment. Please try again.");
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (step === "intro") {
    return (
      <Card className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Cybersecurity Risk Assessment
          </h2>
          <p className="text-cyan-400">
            Take our free 5-minute assessment to discover your security posture
          </p>
        </div>

        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={state.firstName}
              onChange={(e) => setState({ ...state, firstName: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              placeholder="Last Name"
              value={state.lastName}
              onChange={(e) => setState({ ...state, lastName: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <Input
            type="email"
            placeholder="Email Address"
            value={state.email}
            onChange={(e) => setState({ ...state, email: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Input
            placeholder="Company Name"
            value={state.companyName}
            onChange={(e) => setState({ ...state, companyName: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Input
            placeholder="Phone (Optional)"
            value={state.phone}
            onChange={(e) => setState({ ...state, phone: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
          >
            Start Assessment
          </Button>
        </form>
      </Card>
    );
  }

  if (step === "questions") {
    const question = QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

    return (
      <Card className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-cyan-400 text-sm">
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </span>
            <span className="text-gray-400 text-sm">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-2">{question.category}</h3>
          <p className="text-gray-300">{question.question}</p>
        </div>

        <div className="space-y-3 mb-8">
          {[0, 2, 4, 6, 8, 10].map((score) => (
            <button
              key={score}
              onClick={() => handleScoreSubmit(score)}
              disabled={submitMutation.isPending}
              className="w-full p-4 text-left bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-cyan-500 rounded-lg text-white transition-all disabled:opacity-50"
            >
              <span className="font-semibold">{score}/10</span>
              <span className="text-gray-400 ml-4">
                {score === 0 && "Not at all"}
                {score === 2 && "Minimal"}
                {score === 4 && "Basic"}
                {score === 6 && "Good"}
                {score === 8 && "Very Good"}
                {score === 10 && "Excellent"}
              </span>
            </button>
          ))}
        </div>

        {submitMutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <Loader2 className="animate-spin" size={20} />
            Submitting...
          </div>
        )}
      </Card>
    );
  }

  if (step === "results" && results) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete!</h2>
          <p className="text-gray-400">Your results have been sent to your email</p>
        </div>

        <div className="bg-slate-700 rounded-lg p-8 mb-8 text-center">
          <p className="text-gray-400 text-sm mb-2">Your Risk Level</p>
          <h3 className={`text-4xl font-bold ${getRiskColor(results.riskLevel)} mb-4`}>
            {results.riskLevel.toUpperCase()}
          </h3>
          <p className="text-2xl text-white font-bold">
            {results.overallScore} / 50
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {QUESTIONS.map((q, idx) => (
            <div key={q.id} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
              <span className="text-white">{q.category}</span>
              <span className="text-cyan-400 font-bold">
                {state[q.key]} / 10
              </span>
            </div>
          ))}
        </div>

        <p className="text-gray-400 text-sm text-center mb-6">
          Our team will reach out within 24 hours with personalized recommendations
        </p>

        <Button
          onClick={() => {
            setState(INITIAL_STATE);
            setStep("intro");
            setCurrentQuestion(0);
          }}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
        >
          Take Assessment Again
        </Button>
      </Card>
    );
  }

  return null;
}
