/**
 * Stripe Checkout Button Component
 * Initiates checkout for helpdesk subscription plans
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface StripeCheckoutButtonProps {
  planName: "Essential" | "Professional" | "Elite";
  userCount: number;
  isAnnual: boolean;
  userEmail: string;
  userId: string | number;
  className?: string;
}

export function StripeCheckoutButton({
  planName,
  userCount,
  isAnnual,
  userEmail,
  userId,
  className = "",
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const result = await createCheckout.mutateAsync({
        planName,
        userCount,
        isAnnual,
        userEmail,
        userId: String(userId),
      });

      if (result.checkoutUrl) {
        // Open Stripe checkout in new tab
        window.open(result.checkoutUrl, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to create checkout session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Get Started"
      )}
    </Button>
  );
}
