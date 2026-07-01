import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Check, Zap, Shield, Clock, ArrowRight } from "lucide-react";

export default function SmartHomeServices() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    serviceInterest: "general",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const contactMutation = trpc.contact.submit.useMutation();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await contactMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        subject: `Smart Home Services Inquiry - ${formData.serviceInterest}`,
        message: `Service Interest: ${formData.serviceInterest}\n\nPlease contact me about smart home installation and automation solutions.`,
        smsOptIn: false,
      });

      toast.success("Quote request submitted! We'll contact you within 24 hours.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        serviceInterest: "general",
      });
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A]">
      {/* Back to Home Button */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0A0E1A] to-transparent pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
            <span className="text-cyan-400 text-sm font-semibold">NEW SERVICE LINE</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Enterprise Smart Home &{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Automation Solutions
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            AI-powered installation, integration, and management of smart home systems for enterprises. Seamlessly connect your infrastructure with cutting-edge automation technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8"
              onClick={() => document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              Get Custom Quote <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-semibold px-8"
              onClick={() => document.getElementById("manus-app")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Solutions
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
            Why Choose GigitekAI for Smart Home?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1: Integration */}
            <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Seamless Integration</h3>
              <p className="text-gray-400">
                Integrates perfectly with your existing IT infrastructure, Microsoft 365, Azure, and enterprise systems. No disruption to operations.
              </p>
            </div>

            {/* Pillar 2: Speed */}
            <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Reduced Installation Time</h3>
              <p className="text-gray-400">
                AI-powered deployment reduces installation time by up to 60%. Get your smart home systems live faster with less downtime.
              </p>
            </div>

            {/* Pillar 3: Support */}
            <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-500/50 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">24/7 AI-Powered Support</h3>
              <p className="text-gray-400">
                Round-the-clock monitoring, maintenance, and support. Our AI agents handle issues before they impact your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manus App Integration */}
      <section id="manus-app" className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Interactive Solution Explorer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🏠", title: "Residential Smart Home", desc: "Full home automation — lighting, security, climate, entertainment. Starting at $2,500.", cta: "Get Quote" },
              { icon: "🏢", title: "Commercial Smart Office", desc: "Enterprise-grade automation for offices, conference rooms, and facilities. Starting at $5,000.", cta: "Get Quote" },
              { icon: "🔒", title: "Security & Surveillance", desc: "AI-powered cameras, access control, and 24/7 monitoring integration. Starting at $1,500.", cta: "Get Quote" },
              { icon: "💡", title: "Smart Lighting", desc: "Automated lighting scenes, energy savings up to 40%, voice & app control. Starting at $800.", cta: "Get Quote" },
              { icon: "🌡️", title: "Climate Control", desc: "Smart HVAC integration, automated scheduling, remote monitoring. Starting at $1,200.", cta: "Get Quote" },
              { icon: "📡", title: "Network & Connectivity", desc: "Enterprise Wi-Fi, structured cabling, and IoT device management. Starting at $2,000.", cta: "Get Quote" },
            ].map((item, i) => (
              <div key={i} className="bg-black/40 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group"
                onClick={() => document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{item.desc}</p>
                <span className="text-cyan-400 text-sm font-semibold group-hover:underline">{item.cta} →</span>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Click any solution to get a custom quote. Our team responds within 24 hours.
          </p>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section id="quote-form" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-2">Get Your Custom Quote</h2>
            <p className="text-gray-400 mb-8">
              Tell us about your smart home needs. Our team will contact you within 24 hours with a personalized solution.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    className="bg-white/5 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@company.com"
                    required
                    className="bg-white/5 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    required
                    className="bg-white/5 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Company Name *
                  </label>
                  <Input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your Company"
                    required
                    className="bg-white/5 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Service Interest *
                </label>
                <select
                  name="serviceInterest"
                  value={formData.serviceInterest}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-cyan-500/30 text-white rounded-lg px-4 py-2 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="general">General Inquiry</option>
                  <option value="installation">Smart Home Installation</option>
                  <option value="automation">Home Automation</option>
                  <option value="integration">System Integration</option>
                  <option value="support">Support & Maintenance</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-3 text-lg"
              >
                {isSubmitting ? "Submitting..." : "Get Custom Quote"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                We respect your privacy. Your information will only be used to contact you about your inquiry.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Why Enterprises Trust GigitekAI
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <Check className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-2">Enterprise-Grade Security</h3>
                <p className="text-gray-400">
                  SOC 2 compliant, HIPAA ready, PCI-DSS certified. Your data is protected with Zero Trust architecture.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-2">99.9% Uptime SLA</h3>
                <p className="text-gray-400">
                  Guaranteed reliability with 24/7 monitoring and rapid incident response.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-2">25+ Years of IT Expertise</h3>
                <p className="text-gray-400">
                  Founded by Microsoft 365 Architects with deep enterprise infrastructure knowledge.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Check className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-2">AI-Powered Automation</h3>
                <p className="text-gray-400">
                  Intelligent agents handle provisioning, monitoring, and support 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Smart Home Infrastructure?
          </h2>

          <p className="text-xl text-gray-300 mb-8">
            Schedule a consultation with our smart home experts and discover how we can accelerate your deployment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8"
              onClick={() => document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              Schedule Consultation <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-semibold px-8"
              onClick={() => window.location.href = "/contact"}
            >
              Contact Us
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              📞 (727) 382-6909 | 📧 support@gigitekai.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
