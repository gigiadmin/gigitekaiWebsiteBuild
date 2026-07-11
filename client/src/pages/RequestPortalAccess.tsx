/**
 * RequestPortalAccess — Public page for users to request support portal access.
 * No login required. Submits to portalAccess.request tRPC mutation.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import {
  Shield,
  CheckCircle,
  ArrowLeft,
  Ticket,
  BookOpen,
  Zap,
  Clock,
  User,
  Building2,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";

export default function RequestPortalAccess() {
  const [submitted, setSubmitted] = useState(false);
  const [alreadyPending, setAlreadyPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    reason: "",
  });

  const requestMutation = trpc.portalAccess.request.useMutation({
    onSuccess: (data) => {
      if (data.alreadyPending) {
        setAlreadyPending(true);
      }
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    requestMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || undefined,
      phone: form.phone.trim() || undefined,
      reason: form.reason.trim() || undefined,
    });
  };

  const features = [
    { icon: Ticket, label: "Submit & Track Tickets", desc: "Open support tickets and follow them in real time" },
    { icon: BookOpen, label: "Full Knowledge Base", desc: "Access 500+ self-service articles and guides" },
    { icon: Zap, label: "AI-Powered Suggestions", desc: "Get instant AI solutions before submitting a ticket" },
    { icon: Clock, label: "24/7 Support Access", desc: "Submit tickets any time, monitored around the clock" },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
              <div className="w-8 h-8 rounded bg-[#00D4FF]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <span className="text-white font-bold text-xl">GigitekAI</span>
            </div>
          </Link>

          <div className="bg-[#0F1A30] border border-[#00D4FF]/20 rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00D4FF]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              {alreadyPending ? "Request Already Submitted" : "Request Received!"}
            </h1>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {alreadyPending
                ? "We already have a pending request for this email address. Our team will review it shortly."
                : "Your access request has been submitted. We'll review it within 1 business day and send you an email once your account is approved."}
            </p>
            <div className="bg-[#0A0E1A] rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">While you wait</p>
              <a
                href="/kb"
                className="flex items-center gap-3 text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Browse our public Knowledge Base for self-service help</span>
              </a>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Top nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded bg-[#00D4FF]/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#00D4FF]" />
              </div>
              <span className="text-white font-bold">GigitekAI</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <a href="/kb" className="text-sm text-gray-400 hover:text-white transition-colors">Knowledge Base</a>
            <a href="/helpdesk" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Info panel */}
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-3 py-1 mb-6">
            <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span className="text-[#00D4FF] text-xs font-medium">Managed Access Portal</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Request Support<br />
            <span className="text-[#00D4FF]">Portal Access</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Get access to GigitekAI's full support portal — submit tickets, track issues, and leverage AI-powered self-service tools. Our team reviews all requests within 1 business day.
          </p>

          <div className="space-y-4 mb-8">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-[#00D4FF]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0F1A30] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Need urgent help?</p>
            <p className="text-white text-sm">Call us at <span className="text-[#00D4FF] font-medium">(727) 382-6909</span> or email <span className="text-[#00D4FF] font-medium">support@gigitekai.com</span></p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-[#0F1A30] border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Request an Account</h2>
          <p className="text-gray-500 text-sm mb-6">Fill in your details and we'll get back to you within 1 business day.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <Label className="text-gray-300 text-sm mb-1.5 block">
                Full Name <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Smith"
                  className="pl-9 bg-[#0A0E1A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#00D4FF]/50"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label className="text-gray-300 text-sm mb-1.5 block">
                Work Email <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@yourcompany.com"
                  className="pl-9 bg-[#0A0E1A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#00D4FF]/50"
                  required
                />
              </div>
            </div>

            {/* Company + Phone row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 text-sm mb-1.5 block">Company</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme Corp"
                    className="pl-9 bg-[#0A0E1A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#00D4FF]/50"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300 text-sm mb-1.5 block">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className="pl-9 bg-[#0A0E1A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#00D4FF]/50"
                  />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label className="text-gray-300 text-sm mb-1.5 block">
                Why do you need access? <span className="text-gray-600">(optional)</span>
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly describe your support needs or how you heard about us..."
                  className="pl-9 bg-[#0A0E1A] border-white/10 text-white placeholder:text-gray-600 focus:border-[#00D4FF]/50 min-h-[90px] resize-none"
                />
              </div>
            </div>

            {requestMutation.error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {requestMutation.error.message || "Something went wrong. Please try again."}
              </p>
            )}

            <Button
              type="submit"
              disabled={requestMutation.isPending || !form.name.trim() || !form.email.trim()}
              className="w-full bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-semibold py-2.5"
            >
              {requestMutation.isPending ? "Submitting..." : "Submit Access Request →"}
            </Button>

            <p className="text-center text-xs text-gray-600">
              Already have an account?{" "}
              <a href="/helpdesk" className="text-[#00D4FF] hover:underline">Sign in here</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
