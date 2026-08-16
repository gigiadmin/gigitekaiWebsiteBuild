/*
  GigitekAI Premium Contact CTA — Clean form, minimal
*/

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function PremiumContact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    contactMutation.mutate({ name, email, company: org, message });
  };

  return (
    <section id="contact-section" className="bg-black py-28 lg:py-36">
      <div className="mx-auto max-w-[700px] px-6 lg:px-10">
        <div className="section-label justify-center">GET IN TOUCH</div>
        <h2 className="font-['Space_Grotesk'] text-3xl lg:text-4xl font-bold text-white text-center tracking-tight mb-4">
          Let's discuss your challenge.
        </h2>
        <p className="text-center text-[#F5F5F5]/50 font-['DM_Sans'] mb-12">
          Tell us what you're working on and we'll respond within one business day.
        </p>

        {submitted ? (
          <div className="text-center py-12">
            <p className="text-[#00D4FF] text-xl font-['Space_Grotesk'] font-semibold">Thank you.</p>
            <p className="text-[#F5F5F5]/60 mt-2 font-['DM_Sans']">We'll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder="Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-transparent border-b border-white/15 text-white placeholder:text-white/30 py-3 px-0 text-base font-['DM_Sans'] focus:outline-none focus:border-[#00D4FF] transition-colors"
            />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-b border-white/15 text-white placeholder:text-white/30 py-3 px-0 text-base font-['DM_Sans'] focus:outline-none focus:border-[#00D4FF] transition-colors"
            />
            <input
              type="text"
              placeholder="Organization"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="w-full bg-transparent border-b border-white/15 text-white placeholder:text-white/30 py-3 px-0 text-base font-['DM_Sans'] focus:outline-none focus:border-[#00D4FF] transition-colors"
            />
            <textarea
              placeholder="What challenge are you facing?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-b border-white/15 text-white placeholder:text-white/30 py-3 px-0 text-base font-['DM_Sans'] focus:outline-none focus:border-[#00D4FF] transition-colors resize-none"
            />
            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={contactMutation.isPending}
                className="btn-cyan text-base disabled:opacity-50"
              >
                {contactMutation.isPending ? "Sending..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
