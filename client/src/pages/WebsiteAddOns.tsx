import { Plus } from "lucide-react";

export default function WebsiteAddOns() {
  const addons = [
    { name: "Blog Setup & Strategy", price: "$250", description: "Content calendar, SEO optimization, monthly posts" },
    { name: "E-commerce Integration", price: "$750", description: "Shopping cart, payment processing, inventory management" },
    { name: "CRM Integration", price: "$400", description: "HubSpot, Pipedrive, or custom CRM connection" },
    { name: "Advanced Analytics", price: "$300", description: "Custom dashboards, conversion tracking, heat mapping" },
    { name: "Video Background", price: "$200", description: "Hero section video, auto-play, mobile optimization" },
    { name: "Live Chat Integration", price: "$150", description: "Real-time visitor support, chat history, routing" },
    { name: "Membership/Portal", price: "$1,000", description: "User login, content gating, subscription management" },
    { name: "API Development", price: "Custom", description: "Custom integrations, data syncing, automation workflows" },
    { name: "Mobile App Landing", price: "$500", description: "App download optimization, app store integration" },
    { name: "Multi-language Setup", price: "$600", description: "Website translation, language switcher, SEO for each language" },
    { name: "Advanced Security", price: "$400", description: "DDoS protection, WAF, security scanning, SSL+ certificate" },
    { name: "Performance Optimization", price: "$300", description: "Speed optimization, CDN setup, caching strategies" },
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">À La Carte Add-ons</h2>
          <p className="text-xl text-gray-400 mb-6">
            Enhance your website with additional features and services
          </p>
          <div className="inline-block bg-blue-900/20 border border-blue-700/30 rounded-lg px-6 py-3">
            <p className="text-blue-300 text-sm">
              💡 <strong>Bundle 3+ add-ons and receive 15% off</strong>
            </p>
          </div>
        </div>

        {/* Add-ons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {addons.map((addon, idx) => (
            <div
              key={idx}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-[#00D4FF]/50 transition-all hover:shadow-lg hover:shadow-[#00D4FF]/10"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex-1">{addon.name}</h3>
                <Plus className="w-5 h-5 text-[#00D4FF] flex-shrink-0 ml-2" />
              </div>
              
              <p className="text-gray-400 text-sm mb-4">{addon.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <span className="text-[#00D4FF] font-bold text-lg">{addon.price}</span>
                <button className="text-[#00D4FF] hover:text-[#00D4FF]/80 text-sm font-semibold transition-colors">
                  Add to Quote
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bundle Recommendation */}
        <div className="bg-gradient-to-r from-[#1a0033] to-gray-900/50 border border-[#9D4EDD] rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-4">Popular Add-on Bundles</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Bundle 1 */}
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
              <h4 className="text-lg font-bold text-white mb-3">Content Creator Bundle</h4>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ Blog Setup & Strategy</li>
                <li>✓ Advanced Analytics</li>
                <li>✓ Performance Optimization</li>
              </ul>
              <p className="text-[#00D4FF] font-bold">$750 <span className="text-gray-400 text-sm">(Save $200)</span></p>
            </div>

            {/* Bundle 2 */}
            <div className="bg-gray-900/50 rounded-lg p-6 border border-[#9D4EDD]">
              <h4 className="text-lg font-bold text-white mb-3">E-commerce Bundle ⭐</h4>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ E-commerce Integration</li>
                <li>✓ Advanced Security</li>
                <li>✓ Performance Optimization</li>
              </ul>
              <p className="text-[#9D4EDD] font-bold">$1,100 <span className="text-gray-400 text-sm">(Save $350)</span></p>
            </div>

            {/* Bundle 3 */}
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
              <h4 className="text-lg font-bold text-white mb-3">Global Expansion Bundle</h4>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ Multi-language Setup</li>
                <li>✓ Advanced Analytics</li>
                <li>✓ Advanced Security</li>
              </ul>
              <p className="text-[#00D4FF] font-bold">$1,050 <span className="text-gray-400 text-sm">(Save $250)</span></p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-6">
            Not sure which add-ons you need? Let's discuss your goals.
          </p>
          <button className="bg-[#00D4FF] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#00D4FF]/90 transition-colors">
            Get a Custom Quote
          </button>
        </div>
      </div>
    </div>
  );
}
