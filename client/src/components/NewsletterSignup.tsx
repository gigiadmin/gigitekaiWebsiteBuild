/**
 * NewsletterSignup — reusable email capture component
 * Used on the Blog listing page and BlogDetail page.
 * Calls trpc.newsletter.subscribe with the current page as source.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

interface NewsletterSignupProps {
  /** Visual variant — "banner" for full-width section, "compact" for inline card, "inline" for subtle bottom-of-post */
  variant?: "banner" | "compact" | "inline";
  /** Source page to record with the subscription */
  source?: string;
}

export default function NewsletterSignup({
  variant = "banner",
  source,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setEmail("");
      setError("");
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    subscribe.mutate({
      email: email.trim(),
      source: source ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    });
  }

  if (variant === "inline") {
    return (
      <div className="bg-white dark:bg-[#0F1520] rounded-lg border border-gray-200 dark:border-white/5 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">📧 Stay Updated</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          Get AI, cloud, and cybersecurity insights delivered weekly.
        </p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 size={16} />
            Thanks for subscribing!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-gray-50 dark:bg-[#141B2D] border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#00D4FF] h-9 text-sm"
              disabled={subscribe.isPending}
            />
            <Button
              type="submit"
              disabled={subscribe.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-semibold h-9 px-4 text-sm whitespace-nowrap"
            >
              {subscribe.isPending ? (
                <><Loader2 size={12} className="mr-1 animate-spin" />Subscribing…</>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
        )}
        {error && <p className="text-red-500 dark:text-red-400 text-xs mt-2">{error}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">No spam, ever. Unsubscribe anytime.</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-br from-[#0A0E1A] to-[#0F1A30] rounded-2xl border border-[rgba(0,212,255,0.2)] p-6">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-[#00D4FF]" />
          <span
            className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Newsletter
          </span>
        </div>
        <h3
          className="text-lg font-bold text-white mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Stay ahead of the curve
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          AI, cloud, and cybersecurity insights delivered to your inbox. No spam — just actionable intelligence.
        </p>
        {submitted ? (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle2 size={18} />
            You're subscribed! Thanks for joining.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-400 focus:border-[#00D4FF]"
              disabled={subscribe.isPending}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <Button
              type="submit"
              disabled={subscribe.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-semibold w-full"
            >
              {subscribe.isPending ? (
                <><Loader2 size={14} className="mr-2 animate-spin" />Subscribing…</>
              ) : (
                "Subscribe Free"
              )}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">No spam, ever. Unsubscribe anytime.</p>
          </form>
        )}
      </div>
    );
  }

  // Banner variant — full-width section
  return (
    <section className="py-14 bg-gradient-to-br from-[#0A0E1A] via-[#0D1520] to-[#0A0E1A] border-y border-[rgba(0,212,255,0.15)]">
      <div className="container max-w-2xl text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 mb-4">
          <Mail size={22} className="text-[#00D4FF]" />
        </div>

        <h2
          className="text-2xl sm:text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Stay Ahead of the Curve
        </h2>
        <p className="text-gray-400 mb-6 text-base">
          Get the latest AI, cloud, and cybersecurity insights from GigitekAI delivered straight to your inbox. No spam — just actionable intelligence.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-3 text-green-400 text-base font-semibold py-4">
            <CheckCircle2 size={22} />
            You're in! Welcome to the GigitekAI community.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              className="flex-1 bg-[#141B2D] border-[rgba(0,212,255,0.25)] text-white placeholder:text-gray-500 focus:border-[#00D4FF] h-11"
              disabled={subscribe.isPending}
            />
            <Button
              type="submit"
              disabled={subscribe.isPending}
              className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-bold h-11 px-6 whitespace-nowrap"
            >
              {subscribe.isPending ? (
                <><Loader2 size={14} className="mr-2 animate-spin" />Subscribing…</>
              ) : (
                "Subscribe Free"
              )}
            </Button>
          </form>
        )}

        {error && !submitted && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}

        <p className="text-gray-400 text-xs mt-4">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
