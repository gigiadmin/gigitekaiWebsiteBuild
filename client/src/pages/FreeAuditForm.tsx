import { useState } from "react";
import { Button } from "@/components/ui/button";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AuditFormData {
  name: string;
  email: string;
  website: string;
}

export default function FreeAuditForm() {
  const [formData, setFormData] = useState<AuditFormData>({
    name: "",
    email: "",
    website: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitAuditMutation = trpc.freeAudit.submitAudit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Audit request submitted! Check your email for next steps.");
      setFormData({ name: "", email: "", website: "" });
      
      // Reset form after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit audit request");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!formData.website.trim()) {
      toast.error("Please enter your website URL");
      return;
    }

    submitAuditMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div id="audit-form" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/20 to-transparent">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-[#0F1419]/60 border-gray-800/40 p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Get Your Free Website Audit</h2>
            <p className="text-gray-400 mb-4">
              Fill out the form below and our team will conduct a comprehensive audit of your website.
              We'll identify performance issues, SEO opportunities, and create a custom improvement roadmap.
            </p>
            <div className="inline-block bg-green-900/20 border border-green-700/50 rounded-lg px-4 py-2">
              <p className="text-green-300 text-sm font-semibold">
                ✓ <strong>No strings attached</strong> — Completely free, no obligation
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-[#00D4FF] mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-gray-400 mb-4">
                Your audit request has been submitted. Check your email for next steps.
              </p>
              <p className="text-sm text-gray-500">
                Our team will contact you within 24 hours to schedule your free audit.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Smith"
                  className="bg-gray-900/30 border-gray-800/40 text-white placeholder-gray-600 focus:border-[#00D4FF]/50"
                  disabled={submitAuditMutation.isPending}
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Business Email *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className="bg-gray-900/30 border-gray-800/40 text-white placeholder-gray-600 focus:border-[#00D4FF]/50"
                  disabled={submitAuditMutation.isPending}
                />
              </div>

              {/* Website Field */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Website URL *
                </label>
                <Input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                  className="bg-gray-900/30 border-gray-800/40 text-white placeholder-gray-600 focus:border-[#00D4FF]/50"
                  disabled={submitAuditMutation.isPending}
                />
              </div>

              {/* Error Message */}
              {submitAuditMutation.error && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold">Error</p>
                    <p className="text-red-300 text-sm">{submitAuditMutation.error.message}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={submitAuditMutation.isPending}
                className="w-full bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90 font-bold text-base py-6"
              >
                {submitAuditMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Get Your Free Audit"
                )}
              </Button>

              {/* Privacy Note */}
              <p className="text-xs text-gray-500 text-center">
                We respect your privacy. Your information will only be used to contact you about your audit.
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
