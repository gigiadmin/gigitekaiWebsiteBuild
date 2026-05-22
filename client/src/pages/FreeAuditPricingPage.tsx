import { useState } from "react";
import { Check, Zap, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PricingTier {
  id: string;
  name: string;
  subtitle: string;
  monthlyPrice: number;
  discountedPrice: number;
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  isPopular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "Small Business",
    monthlyPrice: 1500,
    discountedPrice: 750,
    description: "Perfect for businesses just getting started with managed IT services",
    features: [
      "Basic Helpdesk Support (Tier 1-2)",
      "24/5 Support",
      "Email & Password Management",
      "Basic Backup & Recovery",
      "Monthly Performance Reports",
      "Up to 10 Users",
    ],
    icon: Zap,
  },
  {
    id: "growth",
    name: "Growth",
    subtitle: "Mid-Market (Most Popular)",
    monthlyPrice: 3500,
    discountedPrice: 1750,
    description: "For scaling businesses ready to leverage AI automation",
    features: [
      "Full Helpdesk Support (Tier 1-3)",
      "24/7 Support",
      "AI Agent Automation",
      "Microsoft 365 Optimization",
      "Advanced Security Stack",
      "Backup & Disaster Recovery",
      "Weekly Check-ins",
      "Up to 50 Users",
    ],
    icon: TrendingUp,
    isPopular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Large Organizations",
    monthlyPrice: 7500,
    discountedPrice: 3750,
    description: "Complete managed services with dedicated support and custom solutions",
    features: [
      "Dedicated Account Manager",
      "24/7 Premium Support",
      "Full AI Automation Suite",
      "Microsoft 365 Architecture & Licensing",
      "Advanced Cybersecurity",
      "Multi-site Management",
      "Custom Integrations",
      "Unlimited Users",
      "Quarterly Business Reviews",
    ],
    icon: Crown,
  },
];

export default function FreeAuditPricingPage() {
  const [selectedTier, setSelectedTier] = useState("growth");

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
            <span className="text-red-400 text-sm font-semibold">🎉 LIMITED TIME: 50% OFF FOR 1 MONTH</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Get Your Free <span className="text-[#00D4FF]">IT Audit</span>
            <br />
            + 50% Off Your First Month
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover exactly where your IT infrastructure stands and what's costing you money. 
            Our comprehensive audit is completely free. Then choose a plan and save 50% on your first month.
          </p>

          <Button
            size="lg"
            className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90 font-bold text-lg px-8 py-6"
            onClick={() => document.getElementById("audit-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            Get Your Free Audit →
          </Button>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-gray-300 text-lg">
              All prices shown include your 50% first-month discount
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.id}
                  className={`relative group transition-[opacity,transform] duration-300 ${
                    tier.isPopular ? "md:scale-105" : ""
                  }`}
                >
                  {/* Popular Badge */}
                  {tier.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-[#00D4FF] to-purple-500 px-6 py-2 rounded-full">
                        <span className="text-black font-bold text-sm">MOST POPULAR</span>
                      </div>
                    </div>
                  )}

                  <Card
                    className={`h-full p-8 border-2 transition-[opacity,transform] duration-300 ${
                      tier.isPopular
                        ? "border-[#00D4FF]/50 bg-[#0F1419]/80 shadow-2xl shadow-[#00D4FF]/20"
                        : "border-gray-800/40 bg-[#0F1419]/40 hover:border-gray-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-lg ${
                        tier.isPopular 
                          ? "bg-[#00D4FF]/20" 
                          : "bg-gray-800/40"
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          tier.isPopular 
                            ? "text-[#00D4FF]" 
                            : "text-gray-300"
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{tier.name}</h3>
                        <p className="text-sm text-gray-300">{tier.subtitle}</p>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-6">{tier.description}</p>

                    {/* Pricing */}
                    <div className="mb-8 pb-8 border-b border-gray-800/40">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold text-[#00D4FF]">
                          ${tier.discountedPrice}
                        </span>
                        <span className="text-gray-300">/month</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-3">
                        First month only — then ${tier.monthlyPrice}/month
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      size="lg"
                      className={`w-full font-bold text-base py-6 transition-[opacity,transform] ${
                        tier.isPopular
                          ? "bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90"
                          : "bg-gray-800/40 text-white hover:bg-gray-800/60 border border-gray-700/40"
                      }`}
                      onClick={() => document.getElementById("audit-form")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Get Free Audit + This Plan
                    </Button>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="mt-12 p-6 bg-gray-900/30 border border-gray-800/40 rounded-lg text-center">
            <p className="text-gray-300">
              <span className="font-semibold text-white">12-month minimum commitment</span> • 
              <span className="ml-2">30-day money-back guarantee</span> • 
              <span className="ml-2">No contracts required</span>
            </p>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-900/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">What's Included in Your Free Audit</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Security Assessment",
                description: "Identify vulnerabilities and compliance gaps in your current setup",
              },
              {
                title: "Cost Analysis",
                description: "Discover where you're overspending and how to optimize IT spend",
              },
              {
                title: "Performance Review",
                description: "Analyze system uptime, speed, and efficiency metrics",
              },
              {
                title: "Roadmap Planning",
                description: "Get a custom 12-month IT modernization and AI automation plan",
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-[#0F1419]/40 border border-gray-800/40 rounded-lg">
                <h3 className="text-lg font-bold text-[#00D4FF] mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
