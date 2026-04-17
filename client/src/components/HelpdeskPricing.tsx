import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpdeskPricing() {
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
        "24/7 live help desk support",
        "Remote support & troubleshooting",
        "Automated patch management",
        "Endpoint security & antivirus",
        "24/7 system monitoring",
        "Backup & disaster recovery included",
        "15-minute critical response SLA",
        "Included at no extra cost",
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
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-lg border transition-all ${
                tier.popular
                  ? "border-cyan-500 bg-gradient-to-b from-cyan-500/10 to-transparent shadow-lg shadow-cyan-500/20 md:scale-105"
                  : "border-border bg-card hover:border-cyan-500/50"
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-cyan-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                    ⭐ MOST POPULAR
                  </span>
                </div>
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
                      ${tier.price}
                    </span>
                    <span className="text-muted-foreground">/user/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum 10 users
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full mb-8 ${
                    tier.popular
                      ? "bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                      : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                  }`}
                >
                  {tier.cta}
                </Button>

                {/* Features */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-foreground">
                    What's Included:
                  </p>
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex gap-3">
                      <Check className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}

                  {tier.notIncluded.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-foreground mt-6">
                        Not Included:
                      </p>
                      {tier.notIncluded.map((feature, i) => (
                        <div key={i} className="flex gap-3 opacity-50">
                          <span className="text-sm text-muted-foreground">
                            ✗ {feature}
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
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Volume Pricing & Special Offers
          </h3>
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
                    Essential
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-cyan-400">
                    Professional
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-foreground">
                    Elite
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Remote Support",
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
                    feature: "Backup & DR",
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
                    feature: "Critical Response SLA",
                    essential: "4 hours",
                    professional: "15 minutes",
                    elite: "15 minutes",
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      {row.essential}
                    </td>
                    <td className="px-6 py-4 text-center text-cyan-400 font-semibold">
                      {row.professional}
                    </td>
                    <td className="px-6 py-4 text-center text-foreground">
                      {row.elite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
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
