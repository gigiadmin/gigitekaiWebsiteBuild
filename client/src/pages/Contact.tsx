/*
  Contact Page — gigitekai.com/contact
  Standalone contact page with form, phone, email, and booking CTA
*/

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Calendar,
  MessageSquare,
  Shield,
} from "lucide-react";

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const sendContactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    sendContactMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a]">
      <SiteNavBar2024 />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00d4ff]/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff] text-xs font-medium mb-4">
            <MessageSquare className="w-3 h-3" />
            Get In Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Let's Talk About Your{" "}
            <span className="text-[#00d4ff]">IT Transformation</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Whether you need M365 support, helpdesk services, cybersecurity, or
            AI automation — we're ready to help. Reach out and we'll respond
            within 24 hours.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="flex-1 px-4 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left — Contact info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info cards */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
              <h2 className="text-white font-semibold text-lg">
                Contact Information
              </h2>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Phone
                  </p>
                  <a
                    href="tel:6096764483"
                    className="text-white hover:text-[#00d4ff] transition-colors font-medium"
                  >
                    609-676-4483
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Email
                  </p>
                  <a
                    href="mailto:support@gigitekai.com"
                    className="text-white hover:text-[#00d4ff] transition-colors font-medium"
                  >
                    support@gigitekai.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Location
                  </p>
                  <p className="text-white font-medium">
                    North America Remote-First
                  </p>
                  <p className="text-gray-400 text-sm">Serving clients across North America</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Business Hours
                  </p>
                  <p className="text-white font-medium">Mon–Fri: 9 AM – 5 PM EST</p>
                  <p className="text-gray-400 text-sm">
                    24/7 helpdesk support available
                  </p>
                </div>
              </div>
            </div>

            {/* Book a call CTA */}
            <div className="rounded-xl border border-[#00d4ff]/30 bg-[#00d4ff]/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#00d4ff]" />
                <h3 className="text-white font-semibold">
                  Prefer a Strategy Call?
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Book a free 15-minute strategy call. Available Mon, Wed &amp;
                Fri — 11 AM to 3 PM EST.
              </p>
              <Button
                className="w-full bg-[#00d4ff] hover:bg-[#00b8e0] text-black font-semibold"
                onClick={() => {
                  // Trigger the sticky CTA bar booking modal
                  window.dispatchEvent(new CustomEvent("gigitekai:open-booking"));
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book a Free Call
              </Button>
            </div>

            {/* Trust badges */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#00d4ff]" />
                <p className="text-white text-sm font-medium">
                  Why Choose GigitekAI
                </p>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] flex-shrink-0" />
                  Microsoft 365 Certified Architect
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] flex-shrink-0" />
                  AI-First Managed Services Provider
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] flex-shrink-0" />
                  Zero Trust &amp; NIST Security Frameworks
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] flex-shrink-0" />
                  24/7 Helpdesk &amp; Automation Support
                </li>
              </ul>
            </div>
          </div>

          {/* Right — Contact form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-7 h-7 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Thank you for reaching out. A member of our team will
                    respond within 24 business hours.
                  </p>
                  <Button
                    variant="outline"
                    className="border-[#00d4ff]/40 text-[#00d4ff] hover:bg-[#00d4ff]/10"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        phone: "",
                        subject: "",
                        message: "",
                      });
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-white text-xl font-semibold mb-6">
                    Send Us a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-gray-300 text-sm">
                          Full Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Smith"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#00d4ff]/50"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-300 text-sm">
                          Email Address <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@company.com"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#00d4ff]/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-gray-300 text-sm">
                          Company Name
                        </Label>
                        <Input
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Acme Corp"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#00d4ff]/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-300 text-sm">
                          Phone Number
                        </Label>
                        <Input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(555) 000-0000"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#00d4ff]/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-gray-300 text-sm">Subject</Label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. M365 Quote, Helpdesk Support, Cybersecurity Assessment..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#00d4ff]/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-gray-300 text-sm">
                        Message <span className="text-red-400">*</span>
                      </Label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your IT challenges, current environment, or what services you're interested in..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#00d4ff]/50 min-h-[140px] resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sendContactMutation.isPending}
                      className="w-full bg-[#00d4ff] hover:bg-[#00b8e0] text-black font-semibold py-3"
                    >
                      {sendContactMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-gray-500">
                      We typically respond within 24 business hours.
                      <br />
                      For urgent support, call{" "}
                      <a
                        href="tel:6096764483"
                        className="text-[#00d4ff] hover:underline"
                      >
                        609-676-4483
                      </a>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
