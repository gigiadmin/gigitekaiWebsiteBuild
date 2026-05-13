/**
 * Payment Success Page
 * Displays after successful Stripe checkout
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "wouter";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get("session_id");
    setSessionId(id);
    setIsLoading(false);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Payment Successful!
        </h1>

        {/* Subheading */}
        <p className="text-muted-foreground mb-8">
          Your helpdesk subscription has been activated. You'll receive a confirmation email shortly.
        </p>

        {/* Session ID (for reference) */}
        {sessionId && (
          <div className="bg-card border border-border rounded-lg p-4 mb-8">
            <p className="text-xs text-muted-foreground mb-2">Session ID:</p>
            <p className="text-sm font-mono text-foreground break-all">{sessionId}</p>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-foreground mb-4">What's Next?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Check your email for a confirmation and invoice</span>
            </li>
            <li className="flex gap-3">
              <Download className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>Download your invoice from your account dashboard</span>
            </li>
            <li className="flex gap-3">
              <span className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5">→</span>
              <span>Your helpdesk support team will reach out within 24 hours</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/account/billing")}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
          >
            View Subscription
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            Return to Home
          </Button>
        </div>

        {/* Support Link */}
        <p className="text-xs text-muted-foreground mt-8">
          Need help?{" "}
          <a
            href="/contact"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
