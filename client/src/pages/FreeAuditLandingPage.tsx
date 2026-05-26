import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";

export default function FreeAuditLandingPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    auditType: "general",
    currentChallenges: "",
    goals: "",
  });

  const submitAudit = trpc.audit.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "✅ Audit Request Submitted",
        description: "We'll review your information and contact you within 24 hours.",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "❌ Submission Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, auditType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.companyName.trim()) {
      toast({
        title: "⚠️ Missing Field",
        description: "Please enter your company name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.contactName.trim()) {
      toast({
        title: "⚠️ Missing Field",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.contactEmail.trim()) {
      toast({
        title: "⚠️ Missing Field",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    submitAudit.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-slate-300 mb-6">
            Your free audit request has been submitted successfully. Our team will review your information and contact you within 24 hours.
          </p>
          <p className="text-sm text-slate-400">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Background accent */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-center mb-12">
            <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-full mb-4">
              <span className="text-cyan-300 text-sm font-semibold">FREE ASSESSMENT</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Get Your Free <span className="text-cyan-400">Cloud & AI Audit</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Discover optimization opportunities, cost savings, and AI automation potential in your Microsoft 365 and cloud infrastructure.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              {
                icon: "🔍",
                title: "Comprehensive Analysis",
                desc: "In-depth review of your current cloud setup",
              },
              {
                icon: "💰",
                title: "Cost Optimization",
                desc: "Identify savings opportunities (avg. 40%)",
              },
              {
                icon: "🤖",
                title: "AI Readiness",
                desc: "Assess automation & agent deployment potential",
              },
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-center hover:border-cyan-500/50 transition"
              >
                <div className="text-3xl mb-2">{benefit.icon}</div>
                <h3 className="text-white font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-slate-400">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Form Section */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6">Request Your Free Audit</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Company & Industry */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name *
                  </label>
                  <Input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Your company name"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Industry
                  </label>
                  <Input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g., Healthcare, Finance, Retail"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Row 2: Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Name *
                  </label>
                  <Input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="your@company.com"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Row 3: Phone & Audit Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Audit Focus
                  </label>
                  <Select value={formData.auditType} onValueChange={handleSelectChange}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="general">General Cloud Audit</SelectItem>
                      <SelectItem value="m365">Microsoft 365 Optimization</SelectItem>
                      <SelectItem value="security">Security & Compliance</SelectItem>
                      <SelectItem value="ai">AI & Automation</SelectItem>
                      <SelectItem value="cost">Cost Optimization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Current Challenges */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Challenges
                </label>
                <Textarea
                  name="currentChallenges"
                  value={formData.currentChallenges}
                  onChange={handleChange}
                  placeholder="What are your main pain points? (e.g., high cloud costs, security concerns, manual workflows)"
                  rows={3}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Row 5: Goals */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Goals & Objectives
                </label>
                <Textarea
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  placeholder="What would you like to achieve? (e.g., reduce costs by 30%, automate helpdesk, improve security posture)"
                  rows={3}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Row 6: Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Information
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Anything else we should know?"
                  rows={2}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitAudit.isPending}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold py-3 rounded-lg transition"
              >
                {submitAudit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Your Free Audit"
                )}
              </Button>

              {/* Disclaimer */}
              <p className="text-xs text-slate-400 text-center">
                We respect your privacy. Your information will only be used to prepare your audit.
              </p>
            </form>
          </div>

          {/* Trust Section */}
          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">Trusted by 50+ companies across North America</p>
            <div className="flex justify-center gap-6 flex-wrap">
              {["HIPAA", "SOC 2", "PCI-DSS", "CMMC"].map((cert) => (
                <div key={cert} className="text-sm font-semibold text-slate-300">
                  ✓ {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
