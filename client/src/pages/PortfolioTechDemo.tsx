import PortfolioDemoSite from "@/components/PortfolioDemoSite";
import { PORTFOLIO_DEMO_SITES } from "@shared/portfolio-sites-config";

export default function PortfolioTechDemo() {
  return <PortfolioDemoSite site={PORTFOLIO_DEMO_SITES.tech} />;
}
