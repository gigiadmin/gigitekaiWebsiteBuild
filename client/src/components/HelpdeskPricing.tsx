import { useState } from "react";
import { Check, X, AlertCircle, TrendingUp, Clock, Shield, Headphones, Zap, HardDrive, Lock, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpdeskPricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const ANNUAL_DISCOUNT = 0.1; // 10% discount for annual prepayment
  const calculatePrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT);
      return Math.round(annualPrice / 12 * 100) / 100; // Round to 2 decimals
    }
    return monthlyPrice;
  };

  const tiers = [
    {
      name: "Essential",
      price: 69,
      description: "Perfect for small teams getting started",
      popular: false,
      cta: "Get Started",
      features: [
        "8am–6pm support (business hours)",
        "Remote support & troubleshooting",
        "Automated patch management",
        "Endpoint security & antivirus",
        "24/7 system monitoring",
        "4-hour critical response SLA",
      ],
      notIncluded: [
        "24/7 live help desk",
        "Backup & disaster recovery",
        "Advanced threat detection",
      ],
    },
    {
      name: "Professional",
      price: 119,
      description: "Our most popular plan - best value",
      popular: true,
      cta: "Get Quote",
      features: [
        { text: "24/7 live help desk support", icon: Headphones },
        { text: "Remote support & troubleshooting", icon: Zap },
        { text: "Automated patch management", icon: Award },
        { text: "Endpoint security & antivirus", icon: Shield },
        { text: "24/7 system monitoring", icon: Clock },
        { text: "Backup & disaster recovery included", icon: HardDrive },
        { text: "15-minute critical response SLA", icon: TrendingUp },
        { text: "Included at no extra cost", icon: Check },
      ],
      notIncluded: ["Advanced threat detection / SOC", "vCIO consulting"],
    },
    {
      name: "Elite",
      price: 189,
      description: "Enterprise-grade support with advanced security",
      popular: false,
      cta: "Contact Sales",
      features: [
        "24/7 live help desk support",
        "Remote support & troubleshooting",
        "Automated patch management",
        "Endpoint security & antivirus",
        "24/7 system monitoring",
        "Immutable backup & disaster recovery",
        "Advanced threat detection / SOC",
        "vCIO strategic consulting (quarterly)",
        "Compliance support (HIPAA/SOC2)",
        "15-minute critical response SLA",
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
            24/7 Managed Help Desk Pricing
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
              aria-label="Toggle annual pricing"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="ml-2 inline-block bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold">
                Save 10%
              </span>
            )}
          </div>
          
          <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
              <span>Predictable Costs</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Clock className="w-5 h-5" />
              <span>24/7 Support Available</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Shield className="w-5 h-5" />
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl border transition-all overflow-hidden ${
                tier.popular
                  ? "border-2 border-cyan-500 bg-gradient-to-b from-cyan-500/20 via-background to-background shadow-2xl shadow-cyan-500/40 md:scale-105 ring-1 ring-cyan-500/60"
                  : "border border-border bg-card hover:border-cyan-500/50"
              }`}
            >
              {/* Popular Ribbon & Accents */}
              {tier.popular && (
                <>
                  {/* Gradient Top Border Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                  
                  {/* Ribbon Banner */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500 text-black px-6 py-2 rounded-lg text-xs font-bold tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap border border-cyan-300">
                      <span className="text-lg">⭐</span>
                      <span>MOST POPULAR</span>
                      <span className="text-lg">⭐</span>
                    </div>
                  </div>
                  
                  {/* Decorative Corner Accents */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full opacity-70 blur-sm"></div>
                  <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-cyan-500/50 rounded-full opacity-50 blur-sm"></div>
                  <div className="absolute top-1/4 -right-1 w-1 h-12 bg-gradient-to-b from-cyan-500/60 to-transparent rounded-full"></div>
                </>
              )}

              <div className="p-8">
                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-cyan-500">
                      ${calculatePrice(tier.price)}
                    </span>
                    <span className="text-muted-foreground">
                      {isAnnual ? '/user/month (annual)' : '/user/month'}
                    </span>
                  </div>
                  {isAnnual ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      ${(calculatePrice(tier.price) * 12).toFixed(2)}/user/year • Minimum 10 users
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Minimum 10 users • Billed monthly
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full mb-8 ${
                    tier.popular
                      ? "bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                      : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                  }`}
                  onClick={() => window.location.href = '#contact'}
                >
                  {tier.cta}
                </Button>

                {/* Features */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-foreground">
                    What's Included:
                  </p>
                  {tier.features.map((feature, i) => {
                    const isObject = typeof feature === 'object' && feature !== null;
                    const text = isObject ? feature.text : feature;
                    const IconComponent = isObject ? feature.icon : Check;
                    return (
                      <div key={i} className="flex gap-3">
                        <IconComponent className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground leading-relaxed">{text}</span>
                      </div>
                    );
                  })}

                  {tier.notIncluded.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-foreground mt-6">
                        Not Included:
                      </p>
                      {tier.notIncluded.map((feature, i) => (
                        <div key={i} className="flex gap-3 opacity-50">
                          <X className="w-4 h-4 text-red-500/50 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Discounts & Terms */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Volume Pricing & Special Offers
          </h3>
          <p className="text-muted-foreground mb-6">
            Save more with volume discounts and annual prepayment options.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {discounts.map((discount, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-foreground font-semibold">
                  {discount.label}
                </span>
                <span className="text-cyan-400">{discount.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-foreground">
                    <div>Essential</div>
                    <div className="text-xs font-normal text-muted-foreground mt-1">
                      ${calculatePrice(69)}{isAnnual ? '/mo' : ''}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-cyan-400">
                    <div>Professional</div>
                    <div className="text-xs font-normal text-cyan-400 mt-1">
                      ${calculatePrice(119)}{isAnnual ? '/mo' : ''}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-foreground">
                    <div>Elite</div>
                    <div className="text-xs font-normal text-muted-foreground mt-1">
                      ${calculatePrice(189)}{isAnnual ? '/mo' : ''}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { category: "Support & Response", isCategory: true },
                  {
                    feature: "Remote Support Hours",
                    essential: "8am–6pm",
                    professional: "24/7",
                    elite: "24/7",
                  },
                  {
                    feature: "Live Help Desk",
                    essential: "No",
                    professional: "Yes",
                    elite: "Yes",
                  },
                  {
                    feature: "Critical Response SLA",
                    essential: "4 hours",
                    professional: "15 minutes",
                    elite: "15 minutes",
                  },
                  {
                    feature: "Ticket-Based Support",
                    essential: "Yes",
                    professional: "Yes",
                    elite: "Yes",
                  },
                  { category: "Infrastructure & Security", isCategory: true },
                  {
                    feature: "Endpoint Security & Antivirus",
                    essential: "Yes",
                    professional: "Yes",
                    elite: "Yes",
                  },
                  {
                    feature: "24/7 System Monitoring",
                    essential: "Yes",
                    professional: "Yes",
                    elite: "Yes",
                  },
                  {
                    feature: "Automated Patch Management",
                    essential: "Yes",
                    professional: "Yes",
                    elite: "Yes",
                  },
                  {
                    feature: "Backup & Disaster Recovery",
                    essential: "No",
                    professional: "Yes",
                    elite: "Yes (Immutable)",
                  },
                  {
                    feature: "Advanced Threat Detection",
                    essential: "No",
                    professional: "No",
                    elite: "Yes",
                  },
                  { category: "Strategic Services", isCategory: true },
                  {
                    feature: "vCIO Consulting",
                    essential: "No",
                    professional: "No",
                    elite: "Quarterly",
                  },
                  {
                    feature: "Compliance Support",
                    essential: "No",
                    professional: "No",
                    elite: "HIPAA/SOC2",
                  },
                  {
                    feature: "Security Assessments",
                    essential: "No",
                    professional: "No",
                    elite: "Yes",
                  },
                  { category: "Pricing", isCategory: true },
                  {
                    feature: "Monthly Cost per User",
                    essential: `$${calculatePrice(69)}`,
                    professional: `$${calculatePrice(119)}`,
                    elite: `$${calculatePrice(189)}`,
                  },
                  {
                    feature: "Annual Cost (10 users)",
                    essential: isAnnual ? `$${(calculatePrice(69) * 12 * 10).toFixed(0)}` : `$${(69 * 12 * 10).toFixed(0)}`,
                    professional: isAnnual ? `$${(calculatePrice(119) * 12 * 10).toFixed(0)}` : `$${(119 * 12 * 10).toFixed(0)}`,
                    elite: isAnnual ? `$${(calculatePrice(189) * 12 * 10).toFixed(0)}` : `$${(189 * 12 * 10).toFixed(0)}`,
                  },
                  {
                    feature: "Minimum Users",
                    essential: "10 users",
                    professional: "10 users",
                    elite: "10 users",
                  },
                ].map((row, idx) => {
                  if (row.isCategory) {
                    return (
                      <tr key={idx} className="bg-cyan-500/10 border-b-2 border-cyan-500/30">
                        <td colSpan={4} className="px-6 py-3 font-bold text-cyan-400 text-sm tracking-wide uppercase">
                          {row.category}
                        </td>
                      </tr>
                    );
                  }
                  const isPricingRow = ['Annual Cost (10 users)', 'Monthly Cost per User'].includes(row.feature || '');
                  return (
                    <tr
                      key={idx}
                      className={`border-b border-border hover:bg-background/50 transition-colors ${
                        isPricingRow ? 'bg-cyan-500/5 font-semibold' : ''
                      }`}
                    >
                      <td className={`px-6 py-4 font-medium ${
                        isPricingRow ? 'text-cyan-400' : 'text-foreground'
                      }`}>
                        {row.feature}
                      </td>
                      <td className={`px-6 py-4 text-center ${
                        isPricingRow
                          ? 'text-cyan-400 font-semibold'
                          : row.essential === 'Yes' ? 'text-green-400' : 'text-muted-foreground'
                      }`}>
                        {row.essential === 'Yes' ? <Check className="w-5 h-5 inline" /> : row.essential === 'No' ? <X className="w-5 h-5 inline text-red-400" /> : row.essential}
                      </td>
                      <td className={`px-6 py-4 text-center font-semibold ${
                        isPricingRow ? 'text-cyan-300' : 'text-cyan-400'
                      }`}>
                        {row.professional === 'Yes' ? <Check className="w-5 h-5 inline text-cyan-400" /> : row.professional === 'No' ? <X className="w-5 h-5 inline text-red-400" /> : row.professional}
                      </td>
                      <td className={`px-6 py-4 text-center ${
                        isPricingRow
                          ? 'text-cyan-400 font-semibold'
                          : row.elite === 'Yes' ? 'text-green-400' : 'text-foreground'
                      }`}>
                        {row.elite === 'Yes' ? <Check className="w-5 h-5 inline" /> : row.elite === 'No' ? <X className="w-5 h-5 inline text-red-400" /> : row.elite}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cyan-500" />
                Can I change plans anytime?
              </h4>
              <p className="text-sm text-muted-foreground">
                Yes. You can upgrade, downgrade, or cancel your plan with 30 days' notice. No long-term contracts required.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cyan-500" />
                What's included in support hours?
              </h4>
              <p className="text-sm text-muted-foreground">
                Phone, email, remote support, and ticket-based troubleshooting. Emergency support available 24/7 for all plans.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cyan-500" />
                Do you offer custom pricing?
              </h4>
              <p className="text-sm text-muted-foreground">
                Absolutely. For organizations with 100+ users or specialized needs, we provide tailored quotes. Contact our sales team.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-cyan-500" />
                Is there a setup or onboarding fee?
              </h4>
              <p className="text-sm text-muted-foreground">
                Standard onboarding is $50/user (waived for 25+ seats). This covers initial setup, training, and system configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose GigitekAI */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-12 mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center">
            Why Choose GigitekAI?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-500 mb-2">99.5%</div>
              <p className="text-foreground font-semibold mb-2">Uptime SLA</p>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade infrastructure with redundancy and failover systems.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-500 mb-2">&lt;15min</div>
              <p className="text-foreground font-semibold mb-2">Critical Response</p>
              <p className="text-sm text-muted-foreground">
                Immediate response to critical issues on Professional and Elite plans.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-500 mb-2">15+</div>
              <p className="text-foreground font-semibold mb-2">Vendor Partnerships</p>
              <p className="text-sm text-muted-foreground">
                Integrated solutions from Microsoft, ConnectSecure, Commvault, and more.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div id="contact" className="text-center mt-16">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to get started?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Schedule a discovery call today to get a custom quote based on your exact user count, infrastructure, and compliance needs. All plans can be tailored to your environment.
          </p>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 text-lg">
            Schedule a Discovery Call
          </Button>
        </div>
      </div>
    </div>
  );
}
