import { Check, X } from "lucide-react";

export default function WebsiteFeatureComparison() {
  const features = [
    { category: "Website Design", items: [
      { name: "Pages Included", starter: "5-10", growth: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
      { name: "Custom Design", starter: "Basic", growth: "Full Custom", pro: "Full Custom", enterprise: "Full Custom" },
      { name: "Mobile Responsive", starter: true, growth: true, pro: true, enterprise: true },
      { name: "E-commerce Capability", starter: false, growth: false, pro: true, enterprise: true },
      { name: "Landing Pages", starter: false, growth: false, pro: true, enterprise: true },
    ]},
    { category: "SEO & Marketing", items: [
      { name: "Basic SEO Setup", starter: true, growth: true, pro: true, enterprise: true },
      { name: "Full Local SEO Services", starter: false, growth: true, pro: true, enterprise: true },
      { name: "Google Ads Management", starter: false, growth: true, pro: true, enterprise: true },
      { name: "Back-linking & Technical SEO", starter: false, growth: true, pro: true, enterprise: true },
      { name: "AEO (AI Engine Optimization)", starter: false, growth: false, pro: false, enterprise: true },
      { name: "PPC & LSA Management", starter: false, growth: false, pro: false, enterprise: true },
    ]},
    { category: "Integrations & Features", items: [
      { name: "Contact Forms", starter: true, growth: true, pro: true, enterprise: true },
      { name: "CRM Integration", starter: false, growth: true, pro: true, enterprise: true },
      { name: "Advanced Analytics", starter: false, growth: true, pro: true, enterprise: true },
      { name: "API Integrations", starter: false, growth: false, pro: true, enterprise: true },
      { name: "Custom Workflows", starter: false, growth: false, pro: true, enterprise: true },
      { name: "Video Background/Hero", starter: false, growth: false, pro: true, enterprise: true },
    ]},
    { category: "Support & Maintenance", items: [
      { name: "Email Support", starter: true, growth: true, pro: true, enterprise: true },
      { name: "Priority Support (24/5)", starter: false, growth: true, pro: true, enterprise: true },
      { name: "24/7 Premium Support", starter: false, growth: false, pro: false, enterprise: true },
      { name: "Monthly Check-ins", starter: false, growth: true, pro: true, enterprise: true },
      { name: "Weekly Check-ins", starter: false, growth: false, pro: true, enterprise: true },
      { name: "Dedicated Account Manager", starter: false, growth: false, pro: false, enterprise: true },
      { name: "Quarterly Business Reviews", starter: false, growth: false, pro: false, enterprise: true },
    ]},
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Feature Comparison</h2>
          <p className="text-xl text-gray-400">
            See exactly what's included in each plan
          </p>
        </div>

        {/* Comparison Table */}
        <div className="space-y-12">
          {features.map((section, sidx) => (
            <div key={sidx}>
              <h3 className="text-2xl font-bold text-white mb-6 pb-4 border-b border-gray-800">
                {section.category}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-4 px-4 text-gray-300 font-semibold">Feature</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Starter</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Growth</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Pro</th>
                      <th className="text-center py-4 px-4 text-gray-300 font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, iidx) => (
                      <tr key={iidx} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                        <td className="py-4 px-4 text-gray-300">{item.name}</td>
                        <td className="text-center py-4 px-4">
                          {typeof item.starter === "boolean" ? (
                            item.starter ? (
                              <Check className="w-5 h-5 text-[#00D4FF] mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">{item.starter}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          {typeof item.growth === "boolean" ? (
                            item.growth ? (
                              <Check className="w-5 h-5 text-[#9D4EDD] mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">{item.growth}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          {typeof item.pro === "boolean" ? (
                            item.pro ? (
                              <Check className="w-5 h-5 text-[#00D4FF] mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">{item.pro}</span>
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          {typeof item.enterprise === "boolean" ? (
                            item.enterprise ? (
                              <Check className="w-5 h-5 text-[#00D4FF] mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">{item.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
