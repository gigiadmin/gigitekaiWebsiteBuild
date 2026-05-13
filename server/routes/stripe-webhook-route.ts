/**
 * Stripe Webhook Route
 * Express route handler for /api/stripe/webhook
 */

import { Router, Request, Response, raw } from "express";
import Stripe from "stripe";
import {
  verifyWebhookSignature,
  handleCheckoutSessionCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
} from "../stripe-webhook";

const router = Router();

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
router.post(
  "/",
  raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const body = req.body;

    if (!signature) {
      console.error("[Webhook] Missing stripe-signature header");
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);

    if (!event) {
      console.error("[Webhook] Signature verification failed");
      return res.status(400).json({ error: "Signature verification failed" });
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    try {
      // Route event to appropriate handler
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(session);
          break;

        case "customer.subscription.updated":
          const updatedSubscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(updatedSubscription);
          break;

        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(deletedSubscription);
          break;

        case "invoice.paid":
          const paidInvoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(paidInvoice);
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(failedInvoice);
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      // Return success response
      return res.json({ received: true, eventId: event.id });
    } catch (error) {
      console.error("[Webhook] Error processing event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
