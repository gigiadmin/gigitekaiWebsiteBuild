/*
  GigitekAI Home Page — Premium Institutional Rebrand
  Design: Blackstone/Ode-inspired. Pure black. Extreme whitespace.
  Positioning: Fractional CTO & AI Strategy
*/
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import PremiumNav from "@/components/PremiumNav";
import PremiumHero from "@/components/PremiumHero";
import PremiumServices from "@/components/PremiumServices";
import PremiumStats from "@/components/PremiumStats";
import InsightsSection from "@/components/InsightsSection";
import PremiumContact from "@/components/PremiumContact";
import PremiumFooter from "@/components/PremiumFooter";

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <PremiumNav />
      <main className="flex-1">
        <PremiumHero />
        <PremiumServices />
        <PremiumStats />
        <InsightsSection />
        <PremiumContact />
      </main>
      <PremiumFooter />
    </div>
  );
}
