/*
  GigitekAI CTA Section — "Move Forward with Cloud & AI"
  Dark background, large headline + contact form
  Mirrors appliedtech.us bottom CTA section
*/

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, Phone, MapPin, Loader2 } from "lucide-react";
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
      className="py-20 relative overflow-hidden bg-white dark:bg-[#0A0E1A]"
      ref={ref}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — headline */}
          <div
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label">GET STARTED</div>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Transform Your Technology?
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-10">
              Maximize your business potential with enterprise cloud infrastructure and AI solutions. Start with a complimentary Cloud & AI Readiness Assessment — no obligation, no pressure.
            </p>

            {/* Contact info */}
            <div className="space-y-4">
              {[
                { icon: Phone, label: "(727) 382-6909", href: "tel:+17273826909" },
                { icon: Mail, label: "Support@gigitekai.com", href: "mailto:Support@gigitekai.com" },
                { icon: MapPin, label: "Serving clients across North America & Canada", href: "#" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-3 text-gray-300 hover:text-[#00D4FF] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center group-hover:bg-[#00D4FF]/20 transition-colors">
                    <Icon size={16} className="text-[#00D4FF]" />
                  </div>
                  <span className="text-sm">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Right — contact form */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {submitted ? (
              <div className="bg-gray-50 dark:bg-[#141B2D] border border-gray-200 dark:border-[rgba(0,212,255,0.15)] rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3
                  className="text-gray-900 dark:text-white text-2xl font-bold mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Message Received!
                </h3>
                <p className="text-gray-300">
                  Our team will reach out within 1 business day to schedule your complimentary Cloud & AI Readiness Assessment.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-gray-50 dark:bg-[#141B2D] border border-gray-200 dark:border-[rgba(0,212,255,0.15)] rounded-2xl p-8 space-y-5"
              >
                <h3
                  className="text-gray-900 dark:text-white text-xl font-bold mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Request Your Free Assessment
                </h3>
                <p className="text-gray-300 text-sm mb-6">
                  Tell us about your business and we'll design a tailored cloud and AI strategy.
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                    {error}
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1.5 font-medium">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors"
                      placeholder="John Smith"
                      disabled={submitMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1.5 font-medium">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors"
                      placeholder="john@company.com"
                      disabled={submitMutation.isPending}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1.5 font-medium">Company Name</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors"
                    placeholder="Your Company"
                    disabled={submitMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1.5 font-medium">How can we help?</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white dark:bg-[#0A0E1A] border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors resize-none"
                    placeholder="Tell us about your cloud and AI goals..."
                    disabled={submitMutation.isPending}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="btn-cyan w-full justify-center text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <p className="text-gray-300 text-xs text-center">
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
