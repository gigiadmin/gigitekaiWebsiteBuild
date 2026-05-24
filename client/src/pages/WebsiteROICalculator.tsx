import { useState } from "react";
import { TrendingUp } from "lucide-react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";

export default function WebsiteROICalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [conversionRate, setConversionRate] = useState(2);
  const [selectedPlan, setSelectedPlan] = useState("growth");

  const plans = {
    starter: { name: "Starter", monthlyPrice: 1250, trafficIncrease: 15 },
    growth: { name: "Growth", monthlyPrice: 2250, trafficIncrease: 35 },
    pro: { name: "Pro", monthlyPrice: 3750, trafficIncrease: 50 },
    enterprise: { name: "Enterprise", monthlyPrice: 6000, trafficIncrease: 75 },
  };

  const plan = plans[selectedPlan as keyof typeof plans];
  
  // Calculate ROI
  const currentMonthlyRevenue = monthlyRevenue;
  const revenuePercentage = (monthlyRevenue / 100) * conversionRate;
  const trafficIncreasePercent = plan.trafficIncrease;
  const additionalRevenue = (revenuePercentage * trafficIncreasePercent) / 100;
  const monthlyProfit = additionalRevenue - plan.monthlyPrice;
  const annualProfit = monthlyProfit * 12;
  const roi = ((annualProfit / (plan.monthlyPrice * 12)) * 100).toFixed(0);
  const paybackMonths = plan.monthlyPrice > monthlyProfit ? "N/A" : (plan.monthlyPrice / monthlyProfit).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <SiteNavBar2024 />
      <div className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-[#00D4FF]" />
            <h2 className="text-4xl font-bold text-white">Website ROI Calculator</h2>
          </div>
          <p className="text-xl text-gray-400">
            See how much a professional website could earn for your business
          </p>
        </div>

        {/* Calculator */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
          {/* Plan Selection */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-4">Select Your Plan:</label>
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(plans).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`p-4 rounded-lg font-semibold transition-[opacity,transform] ${
                    selectedPlan === key
                      ? "bg-[#00D4FF] text-black border-2 border-[#00D4FF]"
                      : "bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-[#00D4FF]/50"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input Sliders */}
          <div className="space-y-8 mb-8">
            {/* Monthly Revenue */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Current Monthly Revenue: <span className="text-[#00D4FF]">${(monthlyRevenue / 1000).toFixed(0)}K</span>
              </label>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>$10K</span>
                <span>$500K</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Current Conversion Rate: <span className="text-[#00D4FF]">{conversionRate}%</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0.5%</span>
                <span>10%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gradient-to-r from-[#1a0033] to-gray-900/50 border border-[#9D4EDD] rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-8">Your Projected Results</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Monthly Website Investment</p>
                  <p className="text-3xl font-bold text-[#9D4EDD]">${plan.monthlyPrice.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">Projected Traffic Increase</p>
                  <p className="text-3xl font-bold text-[#00D4FF]">+{plan.trafficIncrease}%</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">Additional Monthly Revenue</p>
                  <p className="text-3xl font-bold text-green-400">${additionalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Monthly Profit</p>
                  <p className={`text-3xl font-bold ${monthlyProfit > 0 ? "text-green-400" : "text-orange-400"}`}>
                    ${monthlyProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">Annual Profit</p>
                  <p className={`text-3xl font-bold ${annualProfit > 0 ? "text-green-400" : "text-orange-400"}`}>
                    ${annualProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">ROI (Annual)</p>
                  <p className="text-3xl font-bold text-[#00D4FF]">{roi}%</p>
                </div>
              </div>
            </div>

            {/* Payback Period */}
            {monthlyProfit > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Payback Period</p>
                <p className="text-2xl font-bold text-green-400">
                  {paybackMonths === "N/A" ? "Immediate" : `${paybackMonths} months`}
                </p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong>Disclaimer:</strong> These projections are estimates based on industry averages. Actual results depend on your industry, market, content quality, and marketing efforts. This calculator assumes a linear relationship between traffic increase and revenue. Consult with our team for personalized projections.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">Ready to start seeing results?</p>
          <button className="bg-[#00D4FF] text-black font-bold px-8 py-4 rounded-lg hover:bg-[#00D4FF]/90 transition-colors text-lg">
            Get Your Free Website Audit
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
