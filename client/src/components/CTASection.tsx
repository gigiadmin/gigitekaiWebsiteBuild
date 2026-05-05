/*
  GigitekAI CTA Section — Deloitte-Style Professional Design
  - Professional form styling with enhanced UX
  - +25% larger font sizes
  - Massive whitespace and professional spacing
  - Clean minimal design
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
      className="py-40 lg:py-56 relative overflow-hidden bg-white dark:bg-[#0A0E1A]"
      ref={ref}
    >
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-32 items-start">
          {/* Left — headline and contact info - +25% larger */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label mb-8">GET STARTED</div>
            <h2
              className="text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-10"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Transform Your Technology?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xl leading-relaxed mb-16">
              Maximize your business potential with enterprise cloud infrastructure and AI solutions. Start with a complimentary Cloud & AI Readiness Assessment — no obligation, no pressure.
            </p>

            {/* Contact info - Professional styling - +25% larger */}
            <div className="space-y-6">
              {[
                { icon: Phone, label: "(727) 382-5776", href: "tel:+17273825776" },
                { icon: Mail, label: "Support@gigitekai.com", href: "mailto:Support@gigitekai.com" },
                { icon: MapPin, label: "Serving clients across North America & Canada", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-5 text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] transition-all duration-200 group"
                >
                  <div className="w-14 h-14 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center group-hover:border-[#00D4FF]/50 transition-all duration-300 flex-shrink-0">
                    <Icon size={24} className="text-[#00D4FF]" />
                  </div>
                  <span className="text-lg font-medium group-hover:text-[#00D4FF] transition-colors duration-200">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Right — contact form - Professional styling - +25% larger */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {submitted ? (
              <div className="bg-white dark:bg-[#0F1629] border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-xl p-16 text-center shadow-lg">
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                    <CheckCircle size={40} className="text-[#00D4FF]" />
                  </div>
                </div>
                <h3
                  className="text-gray-900 dark:text-white text-3xl font-bold mb-6"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Message Received!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  Our team will reach out within 1 business day to schedule your complimentary Cloud & AI Readiness Assessment.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-[#0F1629] border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-xl p-12 space-y-8 shadow-lg hover:border-gray-300 dark:hover:border-[rgba(0,212,255,0.3)] transition-all duration-300"
              >
                <div>
                  <h3
                    className="text-gray-900 dark:text-white text-2xl font-bold mb-3"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Request Your Free Assessment
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-base">
                    Tell us about your business and we'll design a tailored cloud and AI strategy.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-5 text-red-600 dark:text-red-400 text-base flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">!</span>
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

                {/* Form fields - +25% larger */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-400 mb-3 font-semibold uppercase tracking-wide">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-300 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-5 py-4 text-gray-900 dark:text-white text-base placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200"
                      placeholder="John Smith"
                      disabled={submitMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-400 mb-3 font-semibold uppercase tracking-wide">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-300 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-5 py-4 text-gray-900 dark:text-white text-base placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200"
                      placeholder="john@company.com"
                      disabled={submitMutation.isPending}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-400 mb-3 font-semibold uppercase tracking-wide">Company Name</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-300 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-5 py-4 text-gray-900 dark:text-white text-base placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200"
                    placeholder="Your Company"
                    disabled={submitMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-400 mb-3 font-semibold uppercase tracking-wide">How can we help?</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-300 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-5 py-4 text-gray-900 dark:text-white text-base placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200 resize-none"
                    placeholder="Tell us about your cloud and AI goals..."
                    disabled={submitMutation.isPending}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="btn-cyan w-full justify-center text-lg py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Request Assessment
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <p className="text-gray-500 dark:text-gray-500 text-sm text-center">
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
