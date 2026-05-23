import PortfolioDemoSite from "@/components/PortfolioDemoSite";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import { PORTFOLIO_DEMO_SITES } from "@shared/portfolio-sites-config";

export default function PortfolioFinanceDemo() {
  return <PortfolioDemoSite site={PORTFOLIO_DEMO_SITES.finance} />;
}
