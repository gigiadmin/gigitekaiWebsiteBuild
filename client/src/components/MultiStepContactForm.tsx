/**
 * Multi-Step Contact Form Component
 * 3-step guided form with higher conversion rates
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";

const Checkbox = ({ checked, onChange, className }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) => (
  <CheckboxUI
    checked={checked}
    onCheckedChange={onChange}
    className={className}
  />
);
import { ChevronRight, CheckCircle } from "lucide-react";

type FormStep = "needs" | "company" | "contact" | "success";

interface FormState {
  needsCybersecurity: boolean;
  needsCloud: boolean;
  needsHelpdesk: boolean;
  needsAI: boolean;
  otherNeeds: string;
  employeeCount: string;
  currentITSetup: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
}

const INITIAL_STATE: FormState = {
  needsCybersecurity: false,
  needsCloud: false,
  needsHelpdesk: false,
  needsAI: false,
  otherNeeds: "",
  employeeCount: "",
  currentITSetup: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
};

export function MultiStepContactForm() {
  const [step, setStep] = useState<FormStep>("needs");
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [results, setResults] = useState<any>(null);

  const submitMutation = trpc.leadgen.submitMultiStepForm.useMutation();

  const handleStep1Next = () => {
    const hasNeeds =
      state.needsCybersecurity ||
      state.needsCloud ||
      state.needsHelpdesk ||
      state.needsAI ||
      state.otherNeeds;
    if (!hasNeeds) {
      alert("Please select at least one service");
      return;
    }
    setStep("company");
  };

  const handleStep2Next = () => {
    if (!state.employeeCount) {
      alert("Please select employee count");
      return;
    }
    setStep("contact");
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.firstName || !state.lastName || !state.email || !state.phone || !state.companyName) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await submitMutation.mutateAsync(state);
      setResults(response);
      setStep("success");
    } catch (error) {
      console.error("Form submission failed:", error);
      alert("Failed to submit form. Please try again.");
    }
  };

  const progress = {
    needs: 33,
    company: 66,
    contact: 100,
    success: 100,
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
      {/* Progress Bar */}
      {step !== "success" && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-cyan-400 text-sm font-semibold">
              Step {step === "needs" ? 1 : step === "company" ? 2 : 3} of 3
            </span>
            <span className="text-gray-400 text-sm">{progress[step]}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress[step]}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 1: What do you need? */}
      {step === "needs" && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">What do you need help with?</h2>
          <p className="text-gray-400 mb-6">Select all that apply</p>

          <div className="space-y-4 mb-8">
            {[
              { key: "needsCybersecurity", label: "Cybersecurity Solutions" },
              { key: "needsCloud", label: "Cloud Services & Migration" },
              { key: "needsHelpdesk", label: "Helpdesk & IT Support" },
              { key: "needsAI", label: "AI & Automation" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors">
              <Checkbox
                checked={state[key as keyof FormState] as boolean}
                onChange={(checked) =>
                  setState({ ...state, [key]: checked })
                }
                className="w-5 h-5"
              />
                <span className="text-white font-medium">{label}</span>
              </label>
            ))}

            <div className="mt-4">
              <label className="block text-white font-medium mb-2">Other needs (optional)</label>
              <Input
                placeholder="Describe other IT needs..."
                value={state.otherNeeds}
                onChange={(e) => setState({ ...state, otherNeeds: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleStep1Next}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center justify-center gap-2"
          >
            Next <ChevronRight size={20} />
          </Button>
        </div>
      )}

      {/* Step 2: Company Info */}
      {step === "company" && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Tell us about your company</h2>
          <p className="text-gray-400 mb-6">This helps us tailor our recommendations</p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-white font-medium mb-2">How many employees?</label>
              <div className="grid grid-cols-2 gap-3">
                {["1-10", "11-50", "51-100", "100+"].map((count) => (
                  <button
                    key={count}
                    onClick={() => setState({ ...state, employeeCount: count })}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      state.employeeCount === count
                        ? "bg-cyan-500 text-black"
                        : "bg-slate-700 text-white hover:bg-slate-600"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Current IT setup (optional)</label>
              <Input
                placeholder="e.g., On-premises servers, cloud-based, hybrid..."
                value={state.currentITSetup}
                onChange={(e) => setState({ ...state, currentITSetup: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setStep("needs")}
              variant="outline"
              className="flex-1 border-slate-600 text-white hover:bg-slate-700"
            >
              Back
            </Button>
            <Button
              onClick={handleStep2Next}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Contact Info */}
      {step === "contact" && (
        <form onSubmit={handleStep3Submit}>
          <h2 className="text-2xl font-bold text-white mb-2">Your contact information</h2>
          <p className="text-gray-400 mb-6">We'll reach out within 24 hours</p>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name *"
                value={state.firstName}
                onChange={(e) => setState({ ...state, firstName: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                placeholder="Last Name *"
                value={state.lastName}
                onChange={(e) => setState({ ...state, lastName: e.target.value })}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Input
              type="email"
              placeholder="Email Address *"
              value={state.email}
              onChange={(e) => setState({ ...state, email: e.target.value })}
              required
              className="bg-slate-700 border-slate-600 text-white"
            />

            <Input
              placeholder="Phone Number *"
              value={state.phone}
              onChange={(e) => setState({ ...state, phone: e.target.value })}
              required
              className="bg-slate-700 border-slate-600 text-white"
            />

            <Input
              placeholder="Company Name *"
              value={state.companyName}
              onChange={(e) => setState({ ...state, companyName: e.target.value })}
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setStep("company")}
              variant="outline"
              className="flex-1 border-slate-600 text-white hover:bg-slate-700"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
            >
              {submitMutation.isPending ? "Submitting..." : "Get Your Consultation"}
            </Button>
          </div>
        </form>
      )}

      {/* Success Screen */}
      {step === "success" && results && (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-gray-400 mb-6">
            We've received your information and will reach out within 24 business hours.
          </p>

          <div className="bg-slate-700 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-white font-bold mb-3">Your Needs:</h3>
            <ul className="text-gray-300 space-y-2">
              {state.needsCybersecurity && <li>✓ Cybersecurity Solutions</li>}
              {state.needsCloud && <li>✓ Cloud Services</li>}
              {state.needsHelpdesk && <li>✓ Helpdesk Support</li>}
              {state.needsAI && <li>✓ AI & Automation</li>}
              {state.otherNeeds && <li>✓ {state.otherNeeds}</li>}
            </ul>
          </div>

          <Button
            onClick={() => {
              setState(INITIAL_STATE);
              setStep("needs");
            }}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
          >
            Submit Another Request
          </Button>
        </div>
      )}
    </Card>
  );
}
