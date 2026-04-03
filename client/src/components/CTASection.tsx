/*
  GigitekAI CTA Section — "Move Forward with Cloud & AI"
  Dark background, large headline + contact form
  Mirrors appliedtech.us bottom CTA section
*/

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="contact"
      className="py-20 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #050810 0%, #0A0E1A 50%, #0F1629 100%)" }}
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
            <div className="section-label">Get in Touch</div>
            <h2
              className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Accelerate Your Business with Cloud & AI?
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Maximize your business potential with enterprise cloud infrastructure and AI solutions. Start with a complimentary Cloud & AI Readiness Assessment — no obligation, no pressure.
            </p>

            {/* Contact info */}
            <div className="space-y-4">
              {[
                { icon: Phone, label: "1-800-GIGIT-AI", href: "tel:+18004444824" },
                { icon: Mail, label: "hello@gigitekai.com", href: "mailto:hello@gigitekai.com" },
                { icon: MapPin, label: "Serving clients across North America", href: "#" },
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
              <div className="cyan-glow-card rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3
                  className="text-white text-2xl font-bold mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Message Received!
                </h3>
                <p className="text-gray-400">
                  Our team will reach out within 1 business day to schedule your complimentary Cloud & AI Readiness Assessment.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="cyan-glow-card rounded-2xl p-8 space-y-5"
              >
                <h3
                  className="text-white text-xl font-bold mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Get Your Free Assessment
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Tell us about your business and we'll design a tailored cloud and AI strategy.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Company Name</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors"
                    placeholder="Your Company"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">How can we help?</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-colors resize-none"
                    placeholder="Tell us about your cloud and AI goals..."
                  />
                </div>

                <button
                  type="submit"
                  className="btn-cyan w-full justify-center text-base py-3.5"
                >
                  Request Free Assessment
                  <ArrowRight size={18} />
                </button>

                <p className="text-gray-600 text-xs text-center">
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
