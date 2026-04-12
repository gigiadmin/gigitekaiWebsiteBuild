import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");

  const tiers = [
    {
      name: "Essentials",
      description: "Perfect for small teams",
      users: "~50 users",
      price: 125,
      features: [
        "Microsoft 365 Business Standard",
        "Basic security & compliance",
        "24/7 AI-powered helpdesk",
        "Monitoring & alerting",
        "Core Sherweb security stack",
        "Email & endpoint protection",
        "Standard support",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      description: "Most popular choice",
      users: "~100 users",
      price: 195,
      features: [
        "Microsoft 365 Business Premium",
        "Advanced EDR & threat detection",
        "Intelligent backup & recovery",
        "AI helpdesk agent automation",
        "Full managed IT services",
        "Identity & access management",
        "Priority support",
        "Copilot-ready infrastructure",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise AI",
      description: "For mission-critical operations",
      users: "~200 users",
      price: 275,
      priceAlt: 325,
      priceNote: "E3 path / E5 path",
      features: [
        "Microsoft 365 E3 or E5",
        "Zero Trust security architecture",
        "Full AI automation agents",
        "Dedicated vCISO advisory",
        "Advanced compliance & governance",
        "Custom integrations",
        "24/7 dedicated support",
        "Quarterly business reviews",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  const addOns = [
    { name: "Microsoft 365 Copilot", price: "35–40", description: "AI-powered productivity" },
    { name: "Defender for Office 365", price: "6–8", description: "Advanced email security" },
    { name: "Entra ID Plan 2", price: "12–15", description: "Zero Trust identity" },
    { name: "Teams Premium / Phone", price: "10–15", description: "Enhanced collaboration" },
  ];

  const monthlyPrice = (annualPrice: number) => {
    const monthly = (annualPrice * 12) / 12;
    return billingCycle === "annual" ? annualPrice : Math.round(monthly * 1.2); // 20% monthly premium
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Transparent Pricing
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            One clean price. Everything included. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingCycle === "annual"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Annual Billing
            </button>
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Monthly Billing (+20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, idx) => (
            <Card
              key={idx}
              className={`relative transition-all ${
                tier.highlighted
                  ? "border-cyan-500 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl shadow-cyan-500/20 scale-105"
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-slate-400">{tier.description}</CardDescription>
                <p className="text-sm text-slate-500 mt-2">{tier.users}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-cyan-400">
                      ${monthlyPrice(tier.price)}
                    </span>
                    <span className="text-slate-400">/user/month</span>
                  </div>
                  {tier.priceAlt && (
                    <p className="text-sm text-slate-500">
                      or ${monthlyPrice(tier.priceAlt)} ({tier.priceNote})
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, fidx) => (
                    <li key={fidx} className="flex gap-3 items-start">
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full mt-6 ${
                    tier.highlighted
                      ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-Ons Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Enhance Your Plan</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {addOns.map((addon, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-colors">
                <p className="font-semibold text-cyan-400 mb-2">${addon.price} PUPM</p>
                <h3 className="font-bold mb-2">{addon.name}</h3>
                <p className="text-sm text-slate-400">{addon.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold mb-3 text-cyan-400">What's included in the base price?</h3>
              <p className="text-slate-300">
                All tiers include Microsoft 365 licenses, 24/7 AI-powered helpdesk, monitoring, patching, and our complete Sherweb security stack (ConnectSecure, DefensX, Harmony/Avanan, NordLayer, NordPass, NordStellar, Afi backup).
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold mb-3 text-cyan-400">Can I add Copilot to any tier?</h3>
              <p className="text-slate-300">
                Yes! Microsoft 365 Copilot is available as an add-on for $35–$40 PUPM on any tier. We recommend it for Professional and Enterprise tiers.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold mb-3 text-cyan-400">Do you offer discounts for annual commitments?</h3>
              <p className="text-slate-300">
                Our annual pricing is already discounted. Monthly billing adds approximately 20% to account for payment processing and flexibility.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold mb-3 text-cyan-400">What if my team size changes?</h3>
              <p className="text-slate-300">
                We scale with you. Your pricing adjusts based on actual user count each month. No long-term lock-in required.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Cloud?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Get a custom proposal tailored to your exact needs. No obligation, no pressure.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 text-lg">
              Request a Proposal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 text-lg">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
