/**
 * Stripe tRPC Router
 * Handles all Stripe-related operations
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createCheckoutSession, createBillingPortalSession } from "./stripe-checkout";
import { TRPCError } from "@trpc/server";

export const stripeRouter = router({
  /**
   * Create a checkout session for helpdesk subscription
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        planName: z.enum(["Essential", "Professional", "Elite"]),
        userCount: z.number().min(10).max(1000),
        isAnnual: z.boolean(),
        userEmail: z.string().email(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const origin = ctx.req?.headers.origin || "https://gigitekai.com";
        
        const checkoutUrl = await createCheckoutSession({
          planName: input.planName,
          userCount: input.userCount,
          isAnnual: input.isAnnual,
          userEmail: input.userEmail,
          userId: input.userId,
          successUrl: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/payment/canceled`,
        });

        return {
          checkoutUrl,
          success: true,
        };
      } catch (error) {
        console.error("[Stripe] Checkout session creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  /**
   * Create a billing portal session for subscription management
   */
  createBillingPortalSession: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const origin = ctx.req?.headers.origin || "https://gigitekai.com";
        
        const portalUrl = await createBillingPortalSession(
          input.customerId,
          `${origin}/account/billing`
        );

        return {
          portalUrl,
          success: true,
        };
      } catch (error) {
        console.error("[Stripe] Billing portal session creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create billing portal session",
        });
      }
    }),
});
