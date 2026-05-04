import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function NewsletterSignupSection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const subscribe = trpc.newsletter.subscribe.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await subscribe.mutateAsync({
        email,
        source: "homepage_newsletter",
      });

      if (result.success) {
        setIsSubmitted(true);
        setEmail("");
        setName("");
        toast.success("Successfully subscribed!");
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        toast.error("Subscription failed");
      }
    } catch (error) {
      toast.error("Failed to subscribe. Please try again.");
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-[#0A0E1A] via-[#0F1A30] to-[#0A0E1A] border-t border-[rgba(0,212,255,0.1)]">
      <div style={{ maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-6 h-6 text-[#00D4FF]" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Stay Updated
            </h2>
          </div>
          <p className="text-gray-400 text-lg">
            Get the latest insights on AI, cloud infrastructure, and managed services delivered to your inbox.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
            <Check className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-emerald-300 font-semibold mb-1">Welcome to GigitekAI Insights!</h3>
            <p className="text-emerald-200/80 text-sm">
              Check your email for a welcome message and start receiving valuable content.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#151D30] border-[rgba(0,212,255,0.12)] text-white placeholder-gray-500"
              />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#151D30] border-[rgba(0,212,255,0.12)] text-white placeholder-gray-500"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <input
                type="checkbox"
                id="consent"
                required
                className="w-4 h-4 rounded border-[rgba(0,212,255,0.2)] bg-[#151D30] cursor-pointer"
              />
              <label htmlFor="consent" className="cursor-pointer">
                I agree to receive email updates and can unsubscribe anytime.
              </label>
            </div>

            <Button
              type="submit"
              disabled={subscribe.isPending}
              className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#0A0E1A] font-semibold hover:shadow-lg hover:shadow-[#00D4FF]/30 disabled:opacity-50"
            >
              {subscribe.isPending ? "Subscribing..." : "Subscribe Now"}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
