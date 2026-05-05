/*
  GigitekAI CTA Section — Fortune 500 Quality Professional Design
  - Professional form styling with enhanced UX
  - Professional contact information display
  - Improved typography hierarchy and spacing
  - Smooth animations and transitions
*/

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, Phone, MapPin, Loader2, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [error, setError] = useState<string | null>(null);

  const submitMutation = trpc.contact.submit.useMutation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await submitMutation.mutateAsync({
        name: form.name,
        email: form.email,
        company: form.company,
        message: form.message,
      });
      setSubmitted(true);
      setForm({ name: "", email: "", company: "", message: "" });
      toast.success("Assessment request submitted!", {
        description: "Our team will contact you within 1 business day.",
        duration: 5000,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit form. Please try again.";
      setError(errorMessage);
      toast.error("Submission failed", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  return (
    <section
      id="contact"
      className="py-24 relative overflow-hidden bg-[#0A0E1A]"
      ref={ref}
    >
      {/* Professional grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.2) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — headline and contact info */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label mb-6">GET STARTED</div>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Transform Your Technology?
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-12">
              Maximize your business potential with enterprise cloud infrastructure and AI solutions. Start with a complimentary Cloud & AI Readiness Assessment — no obligation, no pressure.
            </p>

            {/* Contact info - Professional styling */}
            <div className="space-y-4">
              {[
                { icon: Phone, label: "(727) 382-5776", href: "tel:+17273825776" },
                { icon: Mail, label: "Support@gigitekai.com", href: "mailto:Support@gigitekai.com" },
                { icon: MapPin, label: "Serving clients across North America & Canada", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-4 text-gray-400 hover:text-[#00D4FF] transition-all duration-200 group"
                >
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/30 flex items-center justify-center group-hover:border-[#00D4FF]/50 group-hover:from-[#00D4FF]/30 transition-all duration-300 flex-shrink-0">
                    <Icon size={18} className="text-[#00D4FF]" />
                  </div>
                  <span className="text-base font-medium group-hover:text-[#00D4FF] transition-colors duration-200">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Right — contact form - Professional styling */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {submitted ? (
              <div className="bg-gradient-to-br from-[#0F1629] to-[#141B2D] border border-[rgba(0,212,255,0.2)] rounded-xl p-12 text-center shadow-2xl">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/30 flex items-center justify-center">
                    <CheckCircle size={32} className="text-[#00D4FF]" />
                  </div>
                </div>
                <h3
                  className="text-white text-2xl font-bold mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Message Received!
                </h3>
                <p className="text-gray-400 text-base leading-relaxed">
                  Our team will reach out within 1 business day to schedule your complimentary Cloud & AI Readiness Assessment.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-[#0F1629] to-[#141B2D] border border-[rgba(0,212,255,0.2)] rounded-xl p-10 space-y-6 shadow-2xl hover:border-[rgba(0,212,255,0.3)] transition-all duration-300"
              >
                <div>
                  <h3
                    className="text-white text-xl font-bold mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Request Your Free Assessment
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Tell us about your business and we'll design a tailored cloud and AI strategy.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">!</span>
                    </div>
                    <span>{error}</span>
                  </div>
                )}

                {/* Honeypot fields - hidden from real users, bots fill them */}
                <div className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    autoComplete="off"
                    tabIndex={-1}
                    onChange={(e) => setForm({ ...form, website: e.target.value } as any)}
                  />
                  <label htmlFor="phone2">Phone</label>
                  <input
                    type="text"
                    id="phone2"
                    name="phone2"
                    autoComplete="off"
                    tabIndex={-1}
                    onChange={(e) => setForm({ ...form, phone2: e.target.value } as any)}
                  />
                </div>

                {/* Form fields */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200"
                      placeholder="John Smith"
                      disabled={submitMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200"
                      placeholder="john@company.com"
                      disabled={submitMutation.isPending}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Company Name</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200"
                    placeholder="Your Company"
                    disabled={submitMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">How can we help?</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200 resize-none"
                    placeholder="Tell us about your cloud and AI goals..."
                    disabled={submitMutation.isPending}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="btn-cyan w-full justify-center text-base py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Request Assessment
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-gray-500 text-xs text-center">
                  No spam. No obligation. We respect your privacy.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
