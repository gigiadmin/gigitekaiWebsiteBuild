import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useState, useEffect } from "react";
import { useDomainRouting } from "@/hooks/useDomainRouting";
// TooltipProvider must be eagerly loaded — lazy-loading context providers causes React hooks crash
import { TooltipProvider } from "@/components/ui/tooltip";
// PERF: Lazy-load NotFound — removes Button -> @radix-ui/react-slot from critical path.
// NotFound is only rendered on 404 errors, never on the homepage.
const NotFound = lazy(() => import("@/pages/NotFound"));
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SchemaMarkup } from "./components/SchemaMarkup";
// Toaster must be eagerly loaded — lazy-loading causes React hooks crash in dev
import { Toaster as ToasterComponent } from "@/components/ui/sonner";
// make sure to consider if you need authentication for certain routes
// ── Critical pages — loaded eagerly (part of initial bundle) ────────────
import Home from "./pages/Home";
// SiteNavBar2024, Footer lazy-loaded to reduce initial bundle on mobile
const SiteNavBar2024 = lazy(() => import("@/components/SiteNavBar2024"));
const FooterLazy = lazy(() => import("@/components/Footer"));

// ── Widgets — lazy loaded (deferred to reduce initial bundle / TBT) ────────
const ApprovalGuard = lazy(() => import("./components/ApprovalGuard"));
const AnnouncementBar = lazy(() => import("./components/AnnouncementBar"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
const AIChatWidget = lazy(() => import("./components/AIChatWidget"));
// FloatingContactDial lazy-loaded to reduce initial bundle and TBT
const FloatingContactDial = lazy(() => import("./components/FloatingContactDial"));
// UserChatWidget removed from initial render to improve LCP
// const UserChatWidget = lazy(() => import("./components/UserChatWidget"));
const PWAInstallPrompt = lazy(() => import("./components/PWAInstallPrompt"));
// CopilotChat removed - AIChatWidget is the primary AI chat with voice/upload
const MobileAIDemoCTA = lazy(() => import("./components/MobileAIDemoCTA"));

// ── Public pages — lazy loaded ────────────────────────────────────────────
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const OurTeam = lazy(() => import("./pages/OurTeam"));
const Partners = lazy(() => import("./pages/Partners"));
const IndustriesPage = lazy(() => import("./pages/IndustriesPage"));
const IndustryHealthcare = lazy(() => import("./pages/IndustryHealthcare"));
const IndustryFinancial = lazy(() => import("./pages/IndustryFinancial"));
const IndustryManufacturing = lazy(() => import("./pages/IndustryManufacturing"));
const IndustryRetail = lazy(() => import("./pages/IndustryRetail"));
const IndustryGovernment = lazy(() => import("./pages/IndustryGovernment"));
const IndustryEducation = lazy(() => import("./pages/IndustryEducation"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Services = lazy(() => import("./pages/Services"));
const ManagedITTampa = lazy(() => import("./pages/ManagedITTampa"));
const ManagedITMiami = lazy(() => import("./pages/ManagedITMiami"));
const FloridaResiliency = lazy(() => import("./pages/FloridaResiliency"));
const SwitchProgram = lazy(() => import("./pages/SwitchProgram"));
const ComplianceScorecard = lazy(() => import("./pages/ComplianceScorecard"));
const ComplianceBenchmark = lazy(() => import("./pages/ComplianceBenchmark"));
const RoadmapGenerator = lazy(() => import("./pages/RoadmapGenerator"));
const AdminScorecardDashboard = lazy(() => import("./pages/AdminScorecardDashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
// const ROICalculatorPage = lazy(() => import("./pages/ROICalculatorPage")); // REMOVED: ROI page too complex for now
const HelpdeskPricingPage = lazy(() => import("./pages/HelpdeskPricing"));
const AIStrategicBriefingPage = lazy(() => import("./pages/AIStrategicBriefingPage"));
const AIDemoPage = lazy(() => import("./pages/AIDemoPage"));
const ClientExchangePage = lazy(() => import("./pages/ClientExchangePage"));
const CaseStudiesPage = lazy(() => import("./pages/CaseStudiesPage"));
const WebsitesPage = lazy(() => import("./pages/PortfolioPage"));
const PortfolioFinanceDemo = lazy(() => import("./pages/PortfolioFinanceDemo"));
const PortfolioLegalDemo = lazy(() => import("./pages/PortfolioLegalDemo"));
const PortfolioInsuranceDemo = lazy(() => import("./pages/PortfolioInsuranceDemo"));
const PortfolioVCDemo = lazy(() => import("./pages/PortfolioVCDemo"));
const PortfolioHealthDemo = lazy(() => import("./pages/PortfolioHealthDemo"));
const PortfolioConsultingDemo = lazy(() => import("./pages/PortfolioConsultingDemo"));
const PortfolioTechDemo = lazy(() => import("./pages/PortfolioTechDemo"));
const PortfolioGigitekDemo = lazy(() => import("./pages/PortfolioGigitekDemo"));
const PortfolioDivineSoundsDemo = lazy(() => import("./pages/PortfolioDivineSoundsDemo"));
const PortfolioEcommerceDemo = lazy(() => import("./pages/PortfolioEcommerceDemo"));
const FreeAuditLandingPage = lazy(() => import("./pages/FreeAuditLandingPage"));
const AuditResults = lazy(() => import("./pages/AuditResultsDashboard"));
const WebPricingLandingPage = lazy(() => import("./pages/WebPricingLandingPage"));
const WebDiscoveryIntakePage = lazy(() => import("./pages/WebDiscoveryIntakePage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
// const ContactHarry = lazy(() => import("./pages/ContactHarry")); // hidden - NDA
const ContactCard = lazy(() => import("./pages/ContactCard"));
const KBPublic = lazy(() => import("./pages/KBPublic"));
const PublicKB = lazy(() => import("./pages/PublicKB"));
const KBArticleViewer = lazy(() => import("./pages/KBArticleViewer"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const ScriptsPortal = lazy(() => import("./pages/ScriptsPortal"));
const SmartHomeServices = lazy(() => import("./pages/SmartHomeServices"));

// ── Scripts Portal — lazy loaded ───────────────────────────────────────────

// ── Support Services (customer-facing) — lazy loaded ─────────────────────────────
const SupportLanding = lazy(() => import("./pages/SupportLanding"));
const TicketLookup = lazy(() => import("./pages/TicketLookup"));
const PublicTicketDetail = lazy(() => import("./pages/PublicTicketDetail"));
const HelpDesk = lazy(() => import("./pages/HelpDesk"));
const RemoteSession = lazy(() => import("./pages/RemoteSession"));
const HelpdeskDashboard = lazy(() => import("./pages/HelpdeskDashboard"));
const CreateTicket = lazy(() => import("./pages/CreateTicket"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const TicketFeedback = lazy(() => import("./pages/TicketFeedback"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const HelpdeskAgentGuide = lazy(() => import("./pages/HelpdeskAgentGuide"));
// const HelpdeskROIReport = lazy(() => import("./pages/HelpdeskROIReport")); // REMOVED: ROI page too complex for now

// ── Auth pages — lazy loaded ──────────────────────────────────────────────
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const LogoutConfirmation = lazy(() => import("./pages/LogoutConfirmation"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLoginAzure = lazy(() => import("./pages/AdminLoginAzure"));
const AdminUnlock = lazy(() => import("./pages/AdminUnlock"));

// ── Meeting management — lazy loaded ─────────────────────────────────────
const CancelMeeting = lazy(() => import("./pages/CancelMeeting"));
const RescheduleMeeting = lazy(() => import("./pages/RescheduleMeeting"));

// ── Admin Portal — lazy loaded (all behind ApprovalGuard) ────────────────
const AdminApp = lazy(() => import("./AdminApp"));
const AriaCommandCenter = lazy(() => import("./pages/AriaCommandCenter"));

// M365 health pages (public-facing)
const M365HealthPage = lazy(() => import("./pages/M365HealthPage"));
const M365NotificationsPreferencesPage = lazy(() => import("./pages/M365NotificationsPreferencesPage"));
// Payment pages (Stripe checkout results)
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));

const SurveyPage = lazy(() => import("./pages/SurveyPage"));
const ClientSessionHistory = lazy(() => import("./pages/ClientSessionHistory"));
const CallTranscriptSearch = lazy(() => import("./pages/CallTranscriptSearch"));
const AdminSearchIndexPage = lazy(() => import("./pages/AdminSearchIndexPage"));
const InvestorPortal = lazy(() => import("./pages/InvestorPortal"));
const AINews = lazy(() => import("./pages/AINews"));
const AINewsDetail = lazy(() => import("./pages/AINewsDetail"));

// ── Page loading fallback ─────────────────────────────────────────────────
function PageLoader() {
  return (
    <div
      className="min-h-screen bg-[#0A0E1A] flex items-center justify-center"
      style={{ animation: "fadeIn 0.2s ease-in" }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(0,212,255,0.3); }
          50% { box-shadow: 0 0 20px 6px rgba(0,212,255,0.6); }
        }
        @keyframes bar-grow {
          0% { width: 0%; opacity: 0.6; }
          60% { width: 70%; opacity: 1; }
          100% { width: 90%; opacity: 0.8; }
        }
      `}</style>
      <div className="flex flex-col items-center gap-5">
        <div
          className="w-12 h-12 border-2 border-[#00D4FF] border-t-transparent rounded-full"
          style={{ animation: "spin 0.8s linear infinite, pulse-glow 2s ease-in-out infinite" }}
        />
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">Gigitek</span>
          <span className="text-[#00D4FF] font-bold text-lg tracking-tight">AI</span>
        </div>
        <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00D4FF] rounded-full"
            style={{ animation: "bar-grow 1.5s ease-out forwards" }}
          />
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <main id="main-content" className="skip-target">
        <Switch>
          {/* ── Admin Portal (MUST come before empty route) ── */}
          <Route path="/admin/login" component={AdminLoginAzure} />
          <Route path="/admin/unlock" component={AdminUnlock} />
          <Route path="/admin/*" component={AdminApp} />
          <Route path="/admin" component={AdminApp} />
          <Route path="/aria" component={AriaCommandCenter} />
          {/* ── Public ── */}
          <Route path={"investor-portal"} component={InvestorPortal} />
          <Route path={"/ai-news"} component={AINews} />
          <Route path={"/ai-news/:id"} component={AINewsDetail} />
          <Route path={"/pricing"} component={Pricing} />
          <Route path={"/free-audit"} component={FreeAuditLandingPage} />
          <Route path={"/audit-results"} component={AuditResults} />
          <Route path={"/web-pricing"} component={WebPricingLandingPage} />
          <Route path={"/web-discovery-intake"} component={WebDiscoveryIntakePage} />
          <Route path={"/security"} component={SecurityPage} />
          <Route path={"/helpdesk-pricing"} component={HelpdeskPricingPage} />
          {/* <Route path={"/roi-calculator"} component={ROICalculatorPage} /> */} {/* REMOVED: ROI page too complex for now */}
          <Route path={"/AIStrategicBriefing"} component={AIStrategicBriefingPage} />
          <Route path={"/ai-demo"} component={AIDemoPage} />
          <Route path={"/exchange"} component={ClientExchangePage} />
          <Route path={"/case-studies"} component={CaseStudiesPage} />
          {/* Websites showcase (/websites is canonical, /portfolio redirects for backward compat) */}
          <Route path={"/websites"} component={WebsitesPage} />
          <Route path={"/portfolio"}>{() => { window.location.replace("/websites"); return null; }}</Route>
          <Route path={"/websites/finance"} component={PortfolioFinanceDemo} />
          <Route path={"/portfolio/finance"} component={PortfolioFinanceDemo} />
          <Route path={"/websites/legal"} component={PortfolioLegalDemo} />
          <Route path={"/portfolio/legal"} component={PortfolioLegalDemo} />
          <Route path={"/websites/insurance"} component={PortfolioInsuranceDemo} />
          <Route path={"/portfolio/insurance"} component={PortfolioInsuranceDemo} />
          <Route path={"/websites/vc"} component={PortfolioVCDemo} />
          <Route path={"/portfolio/vc"} component={PortfolioVCDemo} />
          <Route path={"/websites/health"} component={PortfolioHealthDemo} />
          <Route path={"/portfolio/health"} component={PortfolioHealthDemo} />
          <Route path={"/websites/consulting"} component={PortfolioConsultingDemo} />
          <Route path={"/portfolio/consulting"} component={PortfolioConsultingDemo} />
          <Route path={"/websites/tech"} component={PortfolioTechDemo} />
          <Route path={"/portfolio/tech"} component={PortfolioTechDemo} />
          <Route path={"/websites/gigitekai"} component={PortfolioGigitekDemo} />
          <Route path={"/portfolio/gigitekai"} component={PortfolioGigitekDemo} />
          <Route path={"/websites/divinesounds"} component={PortfolioDivineSoundsDemo} />
          <Route path={"/portfolio/divinesounds"} component={PortfolioDivineSoundsDemo} />
          <Route path={"/websites/ecommerce"} component={PortfolioEcommerceDemo} />
          <Route path={"/portfolio/ecommerce"} component={PortfolioEcommerceDemo} />
          <Route path={"/blog"} component={Blog} />
          <Route path={"/insights"} component={Blog} />
          <Route path={"/blog/:slug"} component={BlogDetail} />
          <Route path={"/about"} component={AboutUs} />
          <Route path={"/about-us"} component={AboutUs} />
          <Route path={"/our-team"} component={OurTeam} />
          <Route path={"/partners"} component={Partners} />
          <Route path={"/services"} component={Services} />
          <Route path={"/services/:slug"} component={ServiceDetail} />
          <Route path={"/smart-home"} component={SmartHomeServices} />
          <Route path={"/managed-it-services-tampa"} component={ManagedITTampa} />
          <Route path={"/managed-it-services-miami"} component={ManagedITMiami} />
          <Route path={"/florida-it-resiliency"} component={FloridaResiliency} />
          <Route path={"/switch-program"} component={SwitchProgram} />
          <Route path={"/compliance-scorecard"} component={ComplianceScorecard} />
          <Route path={"/compliance-benchmark"} component={ComplianceBenchmark} />
          <Route path={"/roadmap-generator"} component={RoadmapGenerator} />
          {/* Industries */}
          <Route path="/industries" component={IndustriesPage} />
          <Route path={"/industries/healthcare"} component={IndustryHealthcare} />
          <Route path={"/industries/financial"} component={IndustryFinancial} />
          <Route path={"/industries/manufacturing"} component={IndustryManufacturing} />
          <Route path={"/industries/retail"} component={IndustryRetail} />
          <Route path={"/industries/government"} component={IndustryGovernment} />
          <Route path={"/industries/education"} component={IndustryEducation} />
          {/* Legal */}
          <Route path={"/privacy"} component={PrivacyPolicy} />
          <Route path={"/privacy-policy"} component={PrivacyPolicy} />
          <Route path={"/terms-of-service"} component={TermsOfService} />
          {/* Contact */}
          <Route path={"/contact"} component={Contact} />
          {/* Search */}
          <Route path={"/search"} component={SearchResults} />
          {/* /hh hidden - NDA */}
          <Route path={"/contact-card"} component={ContactCard} />
          {/* KB Public */}
          <Route path={"/kb"} component={PublicKB} />
          <Route path={"/kb/:id"} component={KBArticleViewer} />
          {/* Status Page */}
          <Route path={"/status"} component={StatusPage} />
          {/* Scripts Portal */}
          <Route path={"/scripts"} component={ScriptsPortal} />
          {/* ── Support Services (customer-facing) ── */}
          <Route path={"/support"} component={SupportLanding} />
          <Route path={"/support/lookup"} component={TicketLookup} />
          <Route path={"/support/ticket/:ticketId"} component={PublicTicketDetail} />
          <Route path={"/remote-session/:roomId"} component={RemoteSession} />
          <Route path={"/helpdesk"} component={HelpDesk} />
          <Route path={"/helpdesk/dashboard"} component={HelpdeskDashboard} />
          <Route path={"/helpdesk/create-ticket"} component={CreateTicket} />
          <Route path={"/helpdesk/tickets/new"} component={CreateTicket} />
          <Route path={"/helpdesk/ticket/:ticketId"}>{() => <TicketDetail />}</Route>
          <Route path={"/helpdesk/tickets/:ticketId"}>{() => <TicketDetail />}</Route>
          <Route path={"/helpdesk/ticket/:ticketId/feedback"} component={TicketFeedback} />
          <Route path={"/helpdesk/tickets/:ticketId/feedback"} component={TicketFeedback} />
          <Route path={"/helpdesk/profile"} component={UserProfile} />
          <Route path={"/helpdesk/agent-guide"} component={HelpdeskAgentGuide} />
          {/* <Route path={"/helpdesk/roi"} component={HelpdeskROIReport} /> */} {/* REMOVED: ROI page too complex for now */}
          {/* ── Auth ── */}
          <Route path={"accept-invite"} component={AcceptInvite} />
          <Route path={"logout"} component={LogoutConfirmation} />
          {/* Redirect bridge page handles /redirect.html for MSAL popup flow */}
          {/* ── Meeting management ── */}
          <Route path={"/cancel-meeting/:token"} component={CancelMeeting} />
          <Route path={"/reschedule-meeting/:token"} component={RescheduleMeeting} />
          {/* M365 Health Pages */}
          <Route path={"/m365-status"} component={M365HealthPage} />
          <Route path={"/m365-notifications"} component={M365NotificationsPreferencesPage} />
          {/* Payment Pages */}
          <Route path={"/payment/success"} component={PaymentSuccess} />
          <Route path={"/payment/canceled"} component={PaymentCanceled} />
          {/* Client Session History */}
          <Route path={"/helpdesk/session-history"} component={ClientSessionHistory} />
          {/* Call Transcript Search */}
          <Route path={"call-transcripts"} component={CallTranscriptSearch} />
          {/* Admin Search Index */}
          <Route path={"admin/search-index"} component={AdminSearchIndexPage} />
          {/* ── Fallback ── */}
          <Route path={"/404"} component={NotFound} />
          {/* Home page (MUST be after all specific routes) */}
          <Route path={""} component={Home} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </Suspense>
  );
}

// Global event for AI-to-live-chat handoff coordination
export const HANDOFF_EVENT = "gigitekai:handoff-to-live-chat";

function App() {
  const [location] = useLocation();
  // Enable domain-based routing (gginfo.net → investor portal, gigitekai.com → main site)
  useDomainRouting();
  // Defer heavy widgets until after first user interaction to reduce TBT
  const [widgetsReady, setWidgetsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setWidgetsReady(true), 3000);
    const onInteract = () => { setWidgetsReady(true); clearTimeout(timer); };
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('touchstart', onInteract, { once: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('click', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, []);

  const isMeetingPage = location.startsWith("/cancel-meeting") || location.startsWith("/reschedule-meeting");
  const isAdminPage = location.startsWith("/admin");
  const isHelpdeskPage = location.startsWith("/helpdesk");
  // Hide global widgets on portfolio demo pages so they look like standalone sites
  const isPortfolioDemoPage = /^\/(portfolio|websites)\/(finance|legal|insurance|vc|health|consulting|tech|gigitekai|divinesounds|ecommerce)/.test(location);
  // Note: /web-pricing shows AI chat widget but hides other global widgets
  const hideWidgets = isMeetingPage || isAdminPage || isHelpdeskPage || isPortfolioDemoPage;

  return (
    <ErrorBoundary>
      <SchemaMarkup />
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[9999] focus:bg-[#00D4FF] focus:text-[#0A0E1A] focus:px-4 focus:py-2 focus:font-semibold"
          >
            Skip to main content
          </a>
          <ToasterComponent />
          {typeof window !== 'undefined' && window.location.hostname === 'hh.gigitekai.com' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999, background: '#ff6b00', color: '#fff', textAlign: 'center', padding: '6px 16px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>
              ⚠️ STAGING ENVIRONMENT — hh.gigitekai.com — Changes here are NOT live on gigitekai.com
            </div>
          )}
          <Router />
          {/* CookieConsent loads immediately (no performance impact) */}
          <Suspense fallback={null}>
            {!hideWidgets && <CookieConsent />}
          </Suspense>
          {/* Defer heavy widgets until after LCP to improve performance */}
          {widgetsReady && (
            <Suspense fallback={null}>
              {!hideWidgets && <AnnouncementBar />}
              {!hideWidgets && <FloatingContactDial />}
              {!hideWidgets && <MobileAIDemoCTA />}
              {!hideWidgets && <AIChatWidget />}
              {!isAdminPage && !isMeetingPage && <PWAInstallPrompt />}
            </Suspense>
          )}
          {/* UserChatWidget removed from initial render — load on-demand only */}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
