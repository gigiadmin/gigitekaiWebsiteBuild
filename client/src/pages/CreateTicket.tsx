import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import HelpdeskNav from "@/components/HelpdeskNav";
import { KBSearchWidget } from "@/components/KBSearchWidget";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileText,
  Info,
  Loader2,
  Send,
  Tag,
  Zap,
} from "lucide-react";

const categories = [
  { value: "general_support", label: "General Support", description: "General questions and assistance", icon: "💬" },
  { value: "bug_report", label: "Bug Report", description: "Report a software issue or defect", icon: "🐛" },
  { value: "feature_request", label: "Feature Request", description: "Suggest a new feature or improvement", icon: "💡" },
  { value: "billing", label: "Billing", description: "Billing, invoices, and payment inquiries", icon: "💳" },
];

const priorities = [
  { value: "low", label: "Low", description: "Non-urgent, general inquiry", color: "text-green-400", dot: "bg-green-500", border: "border-green-500/20 hover:border-green-500/40" },
  { value: "medium", label: "Medium", description: "Standard request, normal response time", color: "text-yellow-400", dot: "bg-yellow-500", border: "border-yellow-500/20 hover:border-yellow-500/40" },
  { value: "high", label: "High", description: "Urgent, impacts productivity", color: "text-orange-400", dot: "bg-orange-500", border: "border-orange-500/20 hover:border-orange-500/40" },
  { value: "critical", label: "Critical", description: "System down, immediate attention needed", color: "text-red-400", dot: "bg-red-500", border: "border-red-500/20 hover:border-red-500/40" },
];

export default function CreateTicket() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsAttempted: "",
    priority: "medium" as const,
    category: "general_support" as const,
  });

  const createTicketMutation = trpc.helpdesk.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket created successfully!", {
        description: "Our support team will review your request shortly.",
      });
      navigate("/helpdesk/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create ticket");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleArticleSelect = useCallback((articleId: number, articleTitle: string) => {
    toast.info(`Selected: ${articleTitle}`);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.length < 10) {
      toast.error("Subject must be at least 10 characters");
      return;
    }
    if (formData.description.length < 30) {
      toast.error("Description must be at least 30 characters for AI analysis");
      return;
    }
    if (formData.stepsAttempted.length < 20) {
      toast.error("Please describe at least 20 characters of steps you've already tried");
      return;
    }
    const combinedDescription = `ISSUE DESCRIPTION:\n${formData.description}\n\nSTEPS ALREADY ATTEMPTED:\n${formData.stepsAttempted}`;
    createTicketMutation.mutate({
      ...formData,
      description: combinedDescription,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      <HelpdeskNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/helpdesk/dashboard")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-[#00D4FF] text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Create Support Ticket
          </h1>
          <p className="text-gray-400 text-sm">
            Describe your issue in detail so our team can assist you effectively.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-white font-semibold text-sm mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Tag className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, category: cat.value as any }))}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    formData.category === cat.value
                      ? "bg-[#00D4FF]/10 border-[#00D4FF]/40 shadow-lg shadow-[#00D4FF]/5"
                      : "bg-[#141B2D]/60 border-gray-800/60 hover:border-gray-700"
                  }`}
                >
                  <span className="text-xl mb-2 block">{cat.icon}</span>
                  <p className={`font-semibold text-sm ${formData.category === cat.value ? "text-[#00D4FF]" : "text-white"}`}>
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <FileText className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Subject
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Brief summary of your issue (e.g., 'Unable to access cloud dashboard')"
              required
              minLength={10}
              className="w-full bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all"
            />
            <p className="text-gray-600 text-xs mt-1.5">{formData.title.length}/200 characters (minimum 10) {formData.title.length >= 10 ? "✓" : ""}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Info className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide detailed information about your issue:&#10;&#10;1. What were you trying to do?&#10;2. What happened instead?&#10;3. Any error messages you saw?&#10;4. When did this start happening?"
              required
              minLength={30}
              rows={6}
              className="w-full bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all resize-none"
            />
            <p className="text-gray-600 text-xs mt-1.5">{formData.description.length} characters (minimum 30) {formData.description.length >= 30 ? "✓" : ""}</p>
          </div>

          {/* KB Search Widget */}
          {(formData.title.length > 10 || formData.description.length > 30) && (
            <KBSearchWidget
              ticketTitle={formData.title}
              ticketDescription={formData.description}
              onArticleSelect={handleArticleSelect}
            />
          )}

          {/* Steps Attempted */}
          <div>
            <label className="block text-white font-semibold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <CheckCircle2 className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Steps You've Already Tried
            </label>
            <textarea
              name="stepsAttempted"
              value={formData.stepsAttempted}
              onChange={(e) => setFormData((prev) => ({ ...prev, stepsAttempted: e.target.value }))}
              placeholder="Help us avoid duplicate troubleshooting:&#10;&#10;1. What have you already tried?&#10;2. What were the results?&#10;3. Any changes to your system recently?"
              required
              minLength={20}
              rows={4}
              className="w-full bg-[#141B2D] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-all resize-none"
            />
            <p className="text-gray-600 text-xs mt-1.5">{formData.stepsAttempted.length} characters (minimum 20) {formData.stepsAttempted.length >= 20 ? "✓" : ""}</p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-white font-semibold text-sm mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Zap className="w-4 h-4 inline mr-2 text-[#00D4FF]" />
              Priority Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, priority: p.value as any }))}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    formData.priority === p.value
                      ? `bg-[#141B2D] ${p.border.split(" ")[0]} border-2 shadow-lg`
                      : `bg-[#141B2D]/60 border-gray-800/60 hover:border-gray-700`
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`}></span>
                    <span className={`font-semibold text-sm ${formData.priority === p.value ? p.color : "text-gray-300"}`}>
                      {p.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/15 rounded-xl">
            <Info className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300 font-medium">What happens next?</p>
              <p className="text-xs text-gray-400 mt-1">
                Our support team will review your ticket and respond within 2 business hours for standard requests. Critical issues receive priority attention.
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-xl py-6 shadow-lg shadow-[#00D4FF]/15 hover:shadow-[#00D4FF]/30 transition-all"
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/helpdesk/dashboard")}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:text-white rounded-xl py-6 px-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
