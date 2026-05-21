import { Check } from "lucide-react";

export default function WebsitePricingTiers() {
  const tiers = [
    {
      name: "Starter",
      subtitle: "New & Local Businesses",
      monthlyPrice: 1250,
      description: "Perfect for businesses just getting started with a web presence",
      features: [
        "5-10 Page Website",
        "Mobile Responsive Design",
        "Basic SEO Optimization",
        "Contact Form Integration",
        "Google Analytics Setup",
        "SSL Certificate",
        "Monthly Backups",
        "Email Support",
        "1 Revision Round",
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90",
      isPopular: false,
    },
    {
      name: "Growth",
      subtitle: "Scaling Up",
      monthlyPrice: 2250,
      description: "For businesses ready to leverage advanced web features",
      features: [
        "Unlimited Pages",
        "Custom Website Design",
        "Full Local SEO Services",
        "Google Business Profile Management",
        "Google Ad Management",
        "Back-linking & Technical SEO",
        "Lead Tracking & Monthly Reporting",
        "CRM Integration (HubSpot/Pipedrive)",
        "Advanced Analytics Dashboard",
        "Priority Support (24/5)",
        "Unlimited Revisions",
        "Monthly Strategy Check-ins",
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-[#9D4EDD] text-white hover:bg-[#9D4EDD]/90",
      isPopular: true,
    },
    {
      name: "Pro",
      subtitle: "Growth Mode",
      monthlyPrice: 3750,
      description: "Complete web solutions with custom design and integrations",
      features: [
        "Unlimited Pages + Landing Pages",
        "Custom Website Design",
        "Full Local SEO Services",
        "Google Business Profile Management",
        "Google Ad Management",
        "Back-linking & Community Mentions + Technical SEO",
        "Lead Tracking & Monthly Reporting",
        "E-commerce Capability",
        "Advanced API Integrations",
        "Custom Workflows & Automation",
        "Video Background/Hero Section",
        "Weekly Check-ins & Custom Reports",
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90",
      isPopular: false,
    },
    {
      name: "Enterprise",
      subtitle: "Custom Solutions",
      monthlyPrice: 6000,
      description: "For companies with many locations and complex needs",
      features: [
        "Custom Website + Landing Pages",
        "Full Local SEO Services",
        "AEO (AI Engine Optimization) Services",
        "PPC, Google Ads & LSAs",
        "Larger Amounts of Content + Linking",
        "Weekly Check-ins & Custom Reports",
        "For Companies with Many Locations",
        "Dedicated Account Manager",
        "24/7 Premium Support",
        "Custom API Development",
        "Multi-site Management",
        "Quarterly Business Reviews",
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90",
      isPopular: false,
    },
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Website Solutions Built for Growth
          </h2>
          <p className="text-xl text-gray-400 mb-6">
            Professional websites with SEO, integrations, and ongoing support
          </p>
          <div className="inline-block bg-green-900/30 border border-green-700/50 rounded-lg px-6 py-3">
            <p className="text-green-300 font-semibold">
              🎁 <strong>Limited Time:</strong> 50% OFF + 1 Month FREE on 1-Year Commitment
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl p-8 transition-all ${
                tier.isPopular
                  ? "bg-gradient-to-br from-[#1a0033] to-gray-900/50 border-2 border-[#9D4EDD] md:scale-105 md:z-10"
                  : "bg-gray-900/50 border border-gray-800 hover:border-[#00D4FF]/50"
              }`}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#9D4EDD] text-white px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Tier Info */}
              <h3 className="text-2xl font-bold text-white mb-1">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{tier.subtitle}</p>
              <p className="text-gray-500 text-sm mb-6">{tier.description}</p>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-4xl font-bold ${tier.isPopular ? "text-[#9D4EDD]" : "text-[#00D4FF]"}`}>
                    ${tier.monthlyPrice}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>

              {/* CTA Button */}
              <button className={`w-full font-bold py-3 rounded-lg transition-colors mb-8 ${tier.buttonStyle}`}>
                {tier.buttonText}
              </button>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  WHAT'S INCLUDED:
                </p>
                {tier.features.map((feature, fidx) => (
                  <div key={fidx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.isPopular ? "text-[#9D4EDD]" : "text-[#00D4FF]"}`} />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Note */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6 text-center mb-12">
          <p className="text-gray-300">
            <strong>All prices include:</strong> Monthly maintenance & hosting, SSL certificate, daily backups, and ongoing support
          </p>
        </div>

        {/* Helpdesk Reference */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Need Managed IT Services?</h3>
          <p className="text-gray-400 mb-6">
            We also offer comprehensive helpdesk support, AI automation, and managed IT services. 
            <a href="https://gigitekai.com/helpdesk-pricing" className="text-[#00D4FF] hover:underline ml-1">
              View our helpdesk pricing →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
