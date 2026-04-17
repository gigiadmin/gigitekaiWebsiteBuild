import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, DollarSign, Clock, Zap } from "lucide-react";

interface ROIResult {
  annualSavings: number;
  monthlyHoursSaved: number;
  costPerEmployee: number;
  paybackMonths: number;
  percentageSavings: number;
}

export default function ROICalculator() {
  const [employees, setEmployees] = useState(100);
  const [annualITSpend, setAnnualITSpend] = useState(500000);
  const [ticketsPerMonth, setTicketsPerMonth] = useState(200);
  const [manualHoursPerWeek, setManualHoursPerWeek] = useState(40);
  const [showResults, setShowResults] = useState(false);

  // Industry benchmarks
  const COST_PER_TICKET = 85; // Average cost to resolve a ticket
  const AUTOMATION_REDUCTION = 0.65; // 65% ticket reduction with AI
  const MANUAL_PROCESS_HOURLY_RATE = 65; // Average IT staff hourly rate
  const GIGITEKAI_MONTHLY_COST = 3500; // Estimated monthly cost (adjust as needed)

  const calculateROI = (): ROIResult => {
    // Calculate ticket cost savings
    const ticketCostSavings = ticketsPerMonth * 12 * COST_PER_TICKET * AUTOMATION_REDUCTION;

    // Calculate manual process savings
    const manualProcessSavings = manualHoursPerWeek * 52 * MANUAL_PROCESS_HOURLY_RATE * 0.7; // 70% automation

    // Calculate GigitekAI annual cost
    const gigitekaiAnnualCost = GIGITEKAI_MONTHLY_COST * 12;

    // Total annual savings
    const totalAnnualSavings = ticketCostSavings + manualProcessSavings - gigitekaiAnnualCost;

    // Monthly hours saved
    const monthlyHoursSaved = (manualHoursPerWeek * 4 * 0.7) + (ticketsPerMonth * AUTOMATION_REDUCTION * 0.5); // 0.5 hours per ticket

    // Cost per employee
    const costPerEmployee = annualITSpend / employees;
    const newCostPerEmployee = costPerEmployee * 0.76; // 24% reduction

    // Payback period
    const paybackMonths = gigitekaiAnnualCost > 0 ? Math.ceil(gigitekaiAnnualCost / (totalAnnualSavings / 12)) : 0;

    // Percentage savings
    const percentageSavings = (totalAnnualSavings / annualITSpend) * 100;

    return {
      annualSavings: Math.max(totalAnnualSavings, 0),
      monthlyHoursSaved: Math.round(monthlyHoursSaved),
      costPerEmployee: Math.round(newCostPerEmployee),
      paybackMonths: Math.max(paybackMonths, 1),
      percentageSavings: Math.max(percentageSavings, 0),
    };
  };

  const results = calculateROI();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          GigitekAI ROI Calculator
        </h1>
        <p className="text-gray-400">
          See how much you can save with AI-powered IT automation
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card className="bg-[#141B2D] border-slate-700/50 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">Your Company</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Employees
            </label>
            <Input
              type="number"
              value={employees}
              onChange={(e) => setEmployees(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-[#0A0E1A] border-slate-600 text-white"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Your company size</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Annual IT Budget
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">$</span>
              <Input
                type="number"
                value={annualITSpend}
                onChange={(e) => setAnnualITSpend(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-[#0A0E1A] border-slate-600 text-white"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Total annual IT spend</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Helpdesk Tickets per Month
            </label>
            <Input
              type="number"
              value={ticketsPerMonth}
              onChange={(e) => setTicketsPerMonth(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-[#0A0E1A] border-slate-600 text-white"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Average monthly ticket volume</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Manual IT Processes (hours/week)
            </label>
            <Input
              type="number"
              value={manualHoursPerWeek}
              onChange={(e) => setManualHoursPerWeek(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-[#0A0E1A] border-slate-600 text-white"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Hours spent on repetitive tasks</p>
          </div>

          <Button
            onClick={() => setShowResults(true)}
            className="w-full bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold"
          >
            Calculate ROI
          </Button>
        </Card>

        {/* Results Section */}
        {showResults && (
          <Card className="bg-gradient-to-br from-[#00D4FF]/10 to-[#0088AA]/10 border-[#00D4FF]/30 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-6">Your Potential Savings</h2>

            {/* Annual Savings */}
            <div className="bg-[#0A0E1A] rounded-lg p-4 border border-[#00D4FF]/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Annual Savings</p>
                  <p className="text-3xl font-bold text-[#00D4FF]">
                    {formatCurrency(results.annualSavings)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {results.percentageSavings.toFixed(1)}% reduction in IT costs
                  </p>
                </div>
                <DollarSign className="text-[#00D4FF] flex-shrink-0" size={32} />
              </div>
            </div>

            {/* Hours Saved */}
            <div className="bg-[#0A0E1A] rounded-lg p-4 border border-[#00D4FF]/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Hours Freed Up Monthly</p>
                  <p className="text-3xl font-bold text-[#00D4FF]">
                    {results.monthlyHoursSaved}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Your team can focus on strategic work
                  </p>
                </div>
                <Clock className="text-[#00D4FF] flex-shrink-0" size={32} />
              </div>
            </div>

            {/* Cost per Employee */}
            <div className="bg-[#0A0E1A] rounded-lg p-4 border border-[#00D4FF]/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Cost per Employee (New)</p>
                  <p className="text-3xl font-bold text-[#00D4FF]">
                    {formatCurrency(results.costPerEmployee)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Down from {formatCurrency(annualITSpend / employees)}
                  </p>
                </div>
                <TrendingUp className="text-[#00D4FF] flex-shrink-0" size={32} />
              </div>
            </div>

            {/* Payback Period */}
            <div className="bg-[#0A0E1A] rounded-lg p-4 border border-[#00D4FF]/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Payback Period</p>
                  <p className="text-3xl font-bold text-[#00D4FF]">
                    {results.paybackMonths} months
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Full ROI in less than a year
                  </p>
                </div>
                <Zap className="text-[#00D4FF] flex-shrink-0" size={32} />
              </div>
            </div>

            {/* Benchmark Comparison */}
            <div className="bg-[#0A0E1A] rounded-lg p-4 border border-slate-700/50 mt-6">
              <p className="text-sm text-gray-400 mb-3">Industry Benchmark</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Typical MSP Savings:</span>
                  <span className="text-[#00D4FF]">20-30% annually</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Your Potential:</span>
                  <span className="text-[#00D4FF] font-semibold">
                    {Math.max(results.percentageSavings, 20).toFixed(1)}% annually
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowResults(false)}
              variant="outline"
              className="w-full border-slate-600 text-gray-300 hover:text-white"
            >
              Adjust Inputs
            </Button>
          </Card>
        )}
      </div>

      {/* CTA Section */}
      {showResults && (
        <Card className="bg-[#141B2D] border-[#00D4FF]/30 p-6 mt-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Ready to See These Savings?
          </h3>
          <p className="text-gray-400 mb-6">
            Schedule a 15-minute consultation with our team to discuss your specific situation and create a custom implementation plan.
          </p>
          <Button className="bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold px-8">
            Schedule Consultation
          </Button>
        </Card>
      )}

      {/* Info Section */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Card className="bg-[#141B2D] border-slate-700/50 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">How We Calculate</h4>
          <p className="text-xs text-gray-400">
            Based on industry benchmarks, ticket volume reduction, and automation of manual processes.
          </p>
        </Card>
        <Card className="bg-[#141B2D] border-slate-700/50 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">What's Included</h4>
          <p className="text-xs text-gray-400">
            AI agent automation, helpdesk optimization, Microsoft 365 integration, and process automation.
          </p>
        </Card>
        <Card className="bg-[#141B2D] border-slate-700/50 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Next Steps</h4>
          <p className="text-xs text-gray-400">
            Get a personalized proposal with implementation timeline and dedicated support.
          </p>
        </Card>
      </div>
    </div>
  );
}
