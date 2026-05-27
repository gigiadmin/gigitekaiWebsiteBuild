/*
  Contact Page — gigitekai.com/contact
  Standalone contact page with form, phone, email, and booking CTA
*/

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import UnifiedTicketForm, { type TicketFormData } from "@/components/UnifiedTicketForm";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Calendar,
  MessageSquare,
  Shield,
  Zap,
  Users,
  Briefcase,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function Contact() {
  useSEO({ ...SEO_CONFIG["/contact"], path: "/contact", schemaType: "ContactPage" });

  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formLoadTime] = useState(() => Date.now());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sendContactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (err: { message?: string }) => {
      const message = err.message || "Failed to send message. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    },
  });

  const handleFormSubmit = async (data: TicketFormData) => {
    // Honeypot anti-spam
    if (honeypot) throw new Error("Spam detected");
    
    // Timing anti-spam
    if (Date.now() - formLoadTime < 2000) {
      throw new Error("Please wait a moment before submitting.");
    }

    setErrorMsg(null);
    
    return new Promise<void>((resolve, reject) => {
      sendContactMutation.mutate(
        {
          name: data.name,
          email: data.email,
          company: "",
          phone: "",
          subject: data.subject,
          message: data.description,
        },
        {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        }
      );
    });
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
                    href="tel:727-382-6909"
                    className="text-white hover:text-[#00d4ff] transition-colors font-medium"
                  >
                    (727) 382-6909
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
                  <Clock className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Response Time
                  </p>
                  <p className="text-white font-medium">
                    Within 24 business hours
                  </p>
                </div>
              </div>
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
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  {/* Honeypot anti-spam field — hidden from humans */}
                  <div className="absolute opacity-0 -z-10" aria-hidden="true" tabIndex={-1}>
                    <input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      autoComplete="off"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Unified form with auth auto-fill */}
                  <UnifiedTicketForm
                    onSubmit={handleFormSubmit}
                    isLoading={sendContactMutation.isPending}
                    errorMessage={errorMsg}
                    successMessage="Thank you! Your message has been sent."
                    title="Send Us a Message"
                    submitButtonText={sendContactMutation.isPending ? "Sending..." : "Send Message"}
                    showCategory={false}
                    showPriority={false}
                  />
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
