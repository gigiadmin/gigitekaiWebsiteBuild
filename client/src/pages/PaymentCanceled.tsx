/**
 * Payment Canceled Page
 * Displays when user cancels Stripe checkout
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";

export default function PaymentCanceled() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SiteNavBar2024 />
      <div className="flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
        {/* Alert Icon */}
        <div className="mb-6 flex justify-center">
          <AlertCircle className="w-20 h-20 text-yellow-500" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Payment Canceled
        </h1>

        {/* Subheading */}
        <p className="text-muted-foreground mb-8">
          Your payment was not completed. No charges have been made to your account.
        </p>

        {/* Info Box */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-foreground mb-3">What happened?</h3>
          <p className="text-sm text-muted-foreground">
            You canceled the checkout process before completing your payment. Your subscription was not activated.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/pricing")}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
          >
            Try Again
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Button>
        </div>

        {/* Support Link */}
        <p className="text-xs text-muted-foreground mt-8">
          Having trouble?{" "}
          <a
            href="/contact"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Contact our support team
          </a>
        </p>
      </div>
      </div>
    </div>
  );
}
