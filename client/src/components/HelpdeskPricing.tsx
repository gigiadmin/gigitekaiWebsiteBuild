'use client';
import { useState, useEffect } from "react";
import { Check, X, AlertCircle, TrendingUp, Clock, Shield, Headphones, Zap, HardDrive, Lock, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTicketModal } from "./CreateTicketModal";
import { useAuth } from "@/_core/hooks/useAuth";

export default function HelpdeskPricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [userCount, setUserCount] = useState(10);
  const [userCountInput, setUserCountInput] = useState('10');
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSelectPlan = (planName: string) => {
    window.location.href = `/contact?plan=${encodeURIComponent(planName)}&users=${userCount}&billing=${isAnnual ? 'annual' : 'monthly'}`;
  };
  
  const ANNUAL_DISCOUNT = 0.1;
  const VOLUME_DISCOUNT_THRESHOLD = 25;
  const VOLUME_DISCOUNT = 0.08;
  
  const calculatePrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT);
      return Math.round(annualPrice / 12 * 100) / 100;
    }
    return monthlyPrice;
  };

  const calculateTotalPrice = (monthlyPrice: number | null) => {
    if (monthlyPrice === null) return 0;
    let price = monthlyPrice * userCount;
    if (userCount >= VOLUME_DISCOUNT_THRESHOLD) {
      price *= (1 - VOLUME_DISCOUNT);
    }
    if (isAnnual) {
      price *= 12 * (1 - ANNUAL_DISCOUNT);
    } else {
      price *= 12;
    }
    return Math.round(price * 100) / 100;
  };

  const calculateMonthlyCost = (monthlyPrice: number) => {
    let price = monthlyPrice;
    if (userCount >= VOLUME_DISCOUNT_THRESHOLD) {
      price *= (1 - VOLUME_DISCOUNT);
    }
    if (isAnnual) {
      price *= (1 - ANNUAL_DISCOUNT);
    }
    return Math.round(price * 100) / 100;
  };

  const calculateSavings = (monthlyPrice: number) => {
    if (!isAnnual) return 0;
    const regularPrice = monthlyPrice * userCount * 12;
    let discountedPrice = regularPrice;
    if (userCount >= VOLUME_DISCOUNT_THRESHOLD) {
      discountedPrice *= (1 - VOLUME_DISCOUNT);
    }
    discountedPrice *= (1 - ANNUAL_DISCOUNT);
    return Math.round((regularPrice - discountedPrice) * 100) / 100;
  };

  const tiers = [
    {
      name: "Essential Security",
      price: 99,
      description: "Core managed IT + security for small teams",
      popular: false,
      cta: "Learn More",
      features: [
        "24/7 Monitoring & Alerts",
        "Daily Backups",
        "Antivirus & Malware Protection",
        "User Support",
        "Basic Compliance",
      ],
      notIncluded: [
        "24/7 live support",
        "Backup & disaster recovery",
        "Advanced threat detection",
      ],
    },
    {
      name: "Professional Compliance",
      price: 149,
      description: "Advanced security + compliance for regulated industries",
      popular: true,
      cta: "Get Quote",
      features: [
        "Everything in Essential",
        "Compliance Management (HIPAA/Legal)",
        "Security Audits",
        "Policy Documentation",
        "Incident Response",
      ],
      notIncluded: ["Advanced threat detection / SOC", "Managed Copilot (M365)"],
    },
    {
      name: "Elite + Governed AI",
      price: 199,
      description: "Professional tier + managed Copilot for Microsoft 365",
      popular: false,
      cta: "Contact Sales",
      features: [
        "Everything in Professional",
        "Managed Copilot (M365)",
        "AI Governance & Oversight",
        "Automation Workflows",
        "Advanced Analytics",
      ],
      notIncluded: [],
    },
    {
      name: "Enterprise Custom",
      price: null,
      description: "Full-stack managed IT, security, AI, and infrastructure",
      popular: false,
      cta: "Schedule Consultation",
      features: [
        "Everything in Elite",
        "Custom Infrastructure",
        "Dedicated Account Team",
        "Strategic IT Planning",
        "Multi-system integration",
      ],
      notIncluded: [],
    },
  ];

  const discounts = [
    { label: "Minimum", value: "10 users" },
    { label: "Volume Discount", value: "25–50 users: 8% off" },
    { label: "Annual Pre-pay", value: "Additional 10% off (combinable)" },
    { label: "Onboarding", value: "$50/user (waived for 25+ seats)" },
  ];

  return (
    <div className="w-full bg-background py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            24/7 Managed IT Services Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flat monthly per-user rates with no hidden fees, no per-ticket charges, and no surprise invoices.
          </p>
          
          {/* Pricing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual (Save 10%)
            </span>
          </div>
        </div>

        {/* User Count Selector */}
        <div className="flex justify-center mb-12">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <label className="block text-sm font-medium text-foreground mb-2">
              Number of Users
            </label>
            <input
              type="number"
              value={userCountInput}
              onChange={(e) => {
                setUserCountInput(e.target.value);
                const num = parseInt(e.target.value) || 10;
                setUserCount(Math.max(10, num));
              }}
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground mb-4"
              min="10"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {tiers[1].name} Plan Total:
              </p>
              <p className="text-3xl font-bold text-cyan-400">
                ${calculateTotalPrice(tiers[1].price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}/year
              </p>
              {(tiers[1].price !== null && calculateSavings(tiers[1].price) > 0) && (
                <p className="text-sm text-green-400 mt-2">
                  Save ${calculateSavings(tiers[1].price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} with annual billing
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-lg border transition-all ${
                tier.popular
                  ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 shadow-2xl shadow-cyan-500/30 scale-105 lg:scale-110'
                  : 'border-border bg-card hover:shadow-lg transition-shadow'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-cyan-500 text-background px-3 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                {tier.price !== null ? (
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-cyan-400">
                      ${calculatePrice(tier.price)}
                    </div>
                    <p className="text-sm text-muted-foreground">/user/month</p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="text-2xl font-bold text-cyan-400">Custom Quote</div>
                  </div>
                )}

                <Button
                  onClick={() => handleSelectPlan(tier.name)}
                  className={`w-full mb-6 font-bold text-lg py-3 transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/70 hover:scale-105'
                      : 'bg-gray-700 hover:bg-gray-600 text-foreground'
                  }`}
                >
                  {tier.cta}
                </Button>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">What's Included:</p>
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}

                  {tier.notIncluded.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-foreground mt-4">Not Included:</p>
                      {tier.notIncluded.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <X className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-500">{item}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Discounts Section */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">Volume & Annual Discounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {discounts.map((discount, idx) => (
              <div key={idx} className="text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-2">{discount.label}</p>
                <p className="text-lg font-bold text-cyan-400">{discount.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">What's the minimum number of users?</h4>
              <p className="text-muted-foreground">Minimum is 10 users. For smaller teams, contact our sales team for custom pricing.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">Can I change plans mid-year?</h4>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade anytime. Changes take effect the next billing cycle.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">Do you offer onboarding support?</h4>
              <p className="text-muted-foreground">Yes, onboarding is $50/user (waived for 25+ seats). We handle full setup and training.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">What's your SLA?</h4>
              <p className="text-muted-foreground">Essential: 4-hour response. Professional: 15-minute response. Elite: 15-minute response with dedicated support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
