import { Check } from "lucide-react";

export default function WebsitePricingCards() {
  const standardFeatures = [
    "5-10 Page Website",
    "Mobile Responsive Design",
    "Basic SEO Optimization",
    "Contact Form Integration",
    "Google Analytics Setup",
    "SSL Certificate",
    "Monthly Backups",
    "Email Support",
    "1 Revision Round",
  ];

  const customFeatures = [
    "Unlimited Pages",
    "Custom Design (Your Brand)",
    "Advanced SEO Strategy",
    "CRM Integration (HubSpot, Pipedrive)",
    "Advanced Analytics & Tracking",
    "SSL Certificate",
    "Daily Automated Backups",
    "Priority Support (24/5)",
    "Unlimited Revisions",
    "E-commerce Capability",
    "API Integrations",
    "Custom Workflows & Automation",
  ];

  const addonServices = [
    { name: "Blog Setup & Strategy", price: "$500" },
    { name: "E-commerce Integration", price: "$1,500" },
    { name: "CRM Integration (HubSpot/Pipedrive)", price: "$800" },
    { name: "Advanced Analytics Dashboard", price: "$600" },
    { name: "Video Background/Hero Section", price: "$400" },
    { name: "Live Chat Integration", price: "$300" },
    { name: "Membership/Portal System", price: "$2,000" },
    { name: "Custom API Development", price: "Custom Quote" },
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Website Solutions for Every Business
          </h2>
          <p className="text-xl text-gray-400">
            Choose between a quick-launch Standard site or a fully custom solution tailored to your needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Standard Website */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-[#00D4FF]/50 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-2">Standard Website</h3>
            <p className="text-gray-400 mb-6">Perfect for getting online quickly</p>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-[#00D4FF] mb-2">$2,500</div>
              <p className="text-gray-400">One-time setup fee</p>
              <p className="text-sm text-gray-500 mt-2">+ $299/month maintenance & hosting</p>
            </div>

            <button className="w-full bg-[#00D4FF] text-black font-bold py-3 rounded-lg hover:bg-[#00D4FF]/90 transition-colors mb-8">
              Get Started
            </button>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-300 mb-4">WHAT'S INCLUDED:</p>
              {standardFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#00D4FF] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Website */}
          <div className="bg-gradient-to-br from-[#1a0033] to-gray-900/50 border-2 border-[#9D4EDD] rounded-xl p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#9D4EDD] text-white px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Custom Website</h3>
            <p className="text-gray-400 mb-6">Built specifically for your business</p>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-[#9D4EDD] mb-2">$5,000+</div>
              <p className="text-gray-400">One-time setup fee (varies by scope)</p>
              <p className="text-sm text-gray-500 mt-2">+ $499/month maintenance & hosting</p>
            </div>

            <button className="w-full bg-[#9D4EDD] text-white font-bold py-3 rounded-lg hover:bg-[#9D4EDD]/90 transition-colors mb-8">
              Request Quote
            </button>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-300 mb-4">WHAT'S INCLUDED:</p>
              {customFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#9D4EDD] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* À La Carte Add-ons */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-2">À La Carte Add-ons</h3>
          <p className="text-gray-400 mb-8">Enhance your website with additional features</p>

          <div className="grid md:grid-cols-2 gap-4">
            {addonServices.map((addon, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-[#00D4FF]/30 transition-colors">
                <span className="text-gray-300">{addon.name}</span>
                <span className="text-[#00D4FF] font-bold">{addon.price}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-sm text-gray-300">
              💡 <strong>Pro Tip:</strong> Bundle 3+ add-ons and receive 15% off. Contact our sales team for custom quotes on API development and complex integrations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
