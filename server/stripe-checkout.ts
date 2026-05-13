/**
 * Stripe Hosted Checkout Helper
 * Creates checkout sessions for Stripe's hosted checkout page
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia" as any,
});

export interface CheckoutSessionParams {
  planName: "Essential" | "Professional" | "Elite";
  userCount: number;
  isAnnual: boolean;
  userEmail: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

// Stripe Product IDs (you'll create these in Stripe Dashboard)
const STRIPE_PRODUCT_IDS = {
  Essential: process.env.STRIPE_PRODUCT_ESSENTIAL || "",
  Professional: process.env.STRIPE_PRODUCT_PROFESSIONAL || "",
  Elite: process.env.STRIPE_PRODUCT_ELITE || "",
};

// Stripe Price IDs (you'll create these in Stripe Dashboard)
const STRIPE_PRICE_IDS = {
  Essential: process.env.STRIPE_PRICE_ESSENTIAL || "",
  Professional: process.env.STRIPE_PRICE_PROFESSIONAL || "",
  Elite: process.env.STRIPE_PRICE_ELITE || "",
};

const PRICING = {
  Essential: 6900, // $69 in cents
  Professional: 11900, // $119 in cents
  Elite: 18900, // $189 in cents
};

const DISCOUNT_RULES = {
  VOLUME_DISCOUNT_THRESHOLD: 25,
  VOLUME_DISCOUNT_PERCENT: 8,
  ANNUAL_DISCOUNT_PERCENT: 10,
};

/**
 * Calculate the effective price after discounts
 */
function calculateEffectivePrice(
  basePrice: number,
  userCount: number,
  isAnnual: boolean
): number {
  let price = basePrice;

  // Apply volume discount
  if (userCount >= DISCOUNT_RULES.VOLUME_DISCOUNT_THRESHOLD) {
    price *= 1 - DISCOUNT_RULES.VOLUME_DISCOUNT_PERCENT / 100;
  }

  // Apply annual discount
  if (isAnnual) {
    price *= 1 - DISCOUNT_RULES.ANNUAL_DISCOUNT_PERCENT / 100;
  }

  return Math.round(price);
}

/**
 * Create a checkout session for hosted checkout
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<string> {
  const basePrice = PRICING[params.planName];
  const effectivePrice = calculateEffectivePrice(
    basePrice,
    params.userCount,
    params.isAnnual
  );
  const totalPrice = effectivePrice * params.userCount;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `GigitekAI ${params.planName} Helpdesk`,
            description: `${params.userCount} users${params.isAnnual ? " (Annual)" : " (Monthly)"}`,
            metadata: {
              plan: params.planName,
              userCount: params.userCount.toString(),
              isAnnual: params.isAnnual.toString(),
            },
          },
          unit_amount: totalPrice,
          recurring: params.isAnnual
            ? undefined
            : {
                interval: "month",
                interval_count: 1,
              },
        },
        quantity: 1,
      },
    ],
    mode: params.isAnnual ? "payment" : "subscription",
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    metadata: {
      userId: params.userId,
      planName: params.planName,
      userCount: params.userCount.toString(),
      isAnnual: params.isAnnual.toString(),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url || "";
}

/**
 * Get checkout session details
 */
export async function getCheckoutSession(sessionId: string) {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Create a customer portal session for subscription management
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}
