import { useMemo, useState } from "react";
import { Calculator, Clock3, DollarSign, Printer, TrendingUp } from "lucide-react";
import ExpansionPageShell, { SectionHeading } from "@/components/ExpansionPageShell";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function ROICalculatorPage() {
  useSEO({ ...SEO_CONFIG["/roi-calculator"], path: "/roi-calculator", schemaType: "WebPage" });
  const track = useConversionTracking();
  const [values, setValues] = useState({ employees: 50, tickets: 120, resolutionHours: 0.75, laborRate: 55, manualHours: 25, automationRate: 35, monthlyService: 3500, implementation: 12000 });
  const result = useMemo(() => {
    const ticketHours = values.tickets * 12 * values.resolutionHours;
    const processHours = values.manualHours * 52;
    const annualHoursFreed = (ticketHours + processHours) * (values.automationRate / 100);
    const grossAnnualValue = annualHoursFreed * values.laborRate;
    const annualServiceCost = values.monthlyService * 12;
    const netAnnualValue = grossAnnualValue - annualServiceCost;
    const monthlyNet = netAnnualValue / 12;
    const paybackMonths = monthlyNet > 0 ? values.implementation / monthlyNet : null;
    return { annualHoursFreed, grossAnnualValue, netAnnualValue, paybackMonths };
  }, [values]);
  const update = (key: keyof typeof values, value: number) => setValues((current) => ({ ...current, [key]: Math.max(0, value || 0) }));

  return (
    <ExpansionPageShell eyebrow="Managed IT + AI ROI Scenario" title={<>Model the potential value of <span className="text-[#00D4FF]">better operations.</span></>} summary="Use your own workload, labor, automation, and investment assumptions. This calculator is a planning scenario—not a guaranteed savings quote." primaryLabel="Discuss the model" primaryHref="/web-discovery-intake" secondaryLabel="Run the maturity assessment" secondaryHref="/technology-assessment">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-white/10 bg-[#0A1020] p-6 sm:p-8">
            <div className="flex items-center gap-3"><Calculator className="h-6 w-6 text-[#00D4FF]" /><h2 className="text-2xl font-semibold">Your operating assumptions</h2></div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                ["employees", "Employees", 1], ["tickets", "Support tickets / month", 1], ["resolutionHours", "Average hours / ticket", 0.25], ["laborRate", "Loaded labor cost / hour", 1],
                ["manualHours", "Manual process hours / week", 1], ["automationRate", "Addressable workload (%)", 1], ["monthlyService", "Monthly service investment", 100], ["implementation", "One-time implementation", 500],
              ].map(([key, label, step]) => (
                <label key={String(key)} className="text-sm text-slate-300">{String(label)}
                  <input type="number" min="0" step={Number(step)} value={values[key as keyof typeof values]} onChange={(event) => update(key as keyof typeof values, Number(event.target.value))} className="mt-2 min-h-12 w-full border border-white/15 bg-[#070B14] px-3 text-white outline-none focus:border-[#00D4FF]" />
                </label>
              ))}
            </div>
            <button onClick={() => track("roi_scenario_calculated", "roi-calculator", { employees: values.employees, automationRate: values.automationRate })} className="mt-7 min-h-12 w-full bg-[#00D4FF] px-5 font-bold text-[#07101A]">Record this planning scenario</button>
          </div>
          <div>
            <SectionHeading eyebrow="Scenario output" title="A transparent planning model." description="Change any assumption to see the effect immediately. Negative net value is shown rather than hidden, so the model can support an honest scope discussion." />
            <div className="mt-8 grid gap-px bg-white/10 sm:grid-cols-2">
              {[
                [Clock3, "Annual hours potentially freed", Math.round(result.annualHoursFreed).toLocaleString()],
                [DollarSign, "Gross annual operational value", currency.format(result.grossAnnualValue)],
                [TrendingUp, "Net annual value after service", currency.format(result.netAnnualValue)],
                [Calculator, "Estimated implementation payback", result.paybackMonths === null ? "Not reached" : `${result.paybackMonths.toFixed(1)} months`],
              ].map(([Icon, label, value]) => (
                <article key={String(label)} className="bg-[#0A1020] p-6"><Icon className="h-5 w-5 text-[#00D4FF]" /><p className="mt-7 text-sm text-slate-400">{String(label)}</p><p className="mt-2 text-2xl font-semibold text-white">{String(value)}</p></article>
              ))}
            </div>
            <div className="mt-6 border border-amber-400/25 bg-amber-400/5 p-5 text-sm leading-6 text-amber-100/80">This scenario excludes taxes, financing, transition risk, software licensing changes, and benefits that cannot be measured reliably. GigitekAI validates assumptions during discovery before presenting a business case.</div>
            <button onClick={() => { track("roi_scenario_printed", "roi-print"); window.print(); }} className="mt-6 inline-flex min-h-12 items-center gap-2 border border-white/20 px-5 font-semibold hover:border-[#00D4FF]"><Printer className="h-4 w-4" /> Print or save as PDF</button>
          </div>
        </div>
      </section>
    </ExpansionPageShell>
  );
}
