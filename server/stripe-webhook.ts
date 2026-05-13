/**
 * Stripe Webhook Handler
 * Processes payment events and syncs subscription data to database
 */

import Stripe from "stripe";
import { getDb } from "./db";
import { stripeCustomers, stripeSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia" as any,
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error("[Webhook] Signature verification failed:", error);
    return null;
  }
}

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const userId = session.client_reference_id;
  const customerEmail = session.customer_email;
  const metadata = session.metadata || {};

  if (!userId) {
    console.error("[Webhook] No client_reference_id in session");
    return;
  }

  try {
    // Create or update Stripe customer record
    let stripeCustomerId = session.customer as string;

    if (!stripeCustomerId) {
      // If no customer ID, create one
      const customer = await stripe.customers.create({
        email: customerEmail || undefined,
        metadata: {
          userId,
          planName: metadata.planName,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Check if customer already exists in DB
    const existingCustomer = await db
      .select()
      .from(stripeCustomers)
      .where(eq(stripeCustomers.userId, userId));

    if (existingCustomer.length === 0) {
      // Insert new customer
      await db.insert(stripeCustomers).values({
        userId,
        stripeCustomerId,
        email: customerEmail || "",
        createdAt: new Date(),
      });
    } else {
      // Update existing customer
      await db
        .update(stripeCustomers)
        .set({
          stripeCustomerId,
          email: customerEmail || "",
        })
        .where(eq(stripeCustomers.userId, userId));
    }

    // For subscription mode, create subscription record
    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId = typeof session.subscription === "string" 
        ? session.subscription 
        : session.subscription.id;
        
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Extract period timestamps (cast to any to bypass type issues)
      const periodStart = new Date((subscription as any).current_period_start * 1000);
      const periodEnd = new Date((subscription as any).current_period_end * 1000);

      await db.insert(stripeSubscriptions).values({
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId,
        planName: metadata.planName || "Unknown",
        userCount: parseInt(metadata.userCount || "10"),
        isAnnual: metadata.isAnnual === "true",
        status: subscription.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        createdAt: new Date(),
      });

      console.log(
        `[Webhook] Subscription created for user ${userId}: ${subscription.id}`
      );
    }

    // For payment mode (one-time payment)
    if (session.mode === "payment") {
      console.log(
        `[Webhook] One-time payment completed for user ${userId}: ${session.id}`
      );
      // You can add additional logic here for one-time payments
    }
  } catch (error) {
    console.error("[Webhook] Error processing checkout session:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Find the subscription in DB
    const existingSubscription = await db
      .select()
      .from(stripeSubscriptions)
      .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));

    if (existingSubscription.length > 0) {
      // Extract period timestamps (cast to any to bypass type issues)
      const periodStart = new Date((subscription as any).current_period_start * 1000);
      const periodEnd = new Date((subscription as any).current_period_end * 1000);

      // Update subscription status
      await db
        .update(stripeSubscriptions)
        .set({
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
        })
        .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));

      console.log(
        `[Webhook] Subscription updated: ${subscription.id} -> ${subscription.status}`
      );
    }
  } catch (error) {
    console.error("[Webhook] Error updating subscription:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    // Mark subscription as canceled
    await db
      .update(stripeSubscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
      })
      .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));

    console.log(`[Webhook] Subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error("[Webhook] Error deleting subscription:", error);
    throw error;
  }
}

/**
 * Handle invoice.paid event
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log(`[Webhook] Invoice paid: ${invoice.id} for ${invoice.customer}`);
  // You can add additional logic here for tracking paid invoices
}

/**
 * Handle invoice.payment_failed event
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log(
    `[Webhook] Invoice payment failed: ${invoice.id} for ${invoice.customer}`
  );
  // You can add notification logic here
}
