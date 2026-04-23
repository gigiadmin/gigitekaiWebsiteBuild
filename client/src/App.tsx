import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
  // make sure to consider if you need authentication for certain routes

// ── Critical pages — loaded eagerly (part of initial bundle) ──────────────
import Home from "./pages/Home";
import ApprovalGuard from "./components/ApprovalGuard";
// Widgets — loaded eagerly (always visible on public pages)
import AnnouncementBar from "./components/AnnouncementBar";
import CookieConsent from "./components/CookieConsent";
import AIChatWidget from "./components/AIChatWidget";
import FloatingContactDial from "./components/FloatingContactDial";
import UserChatWidget from "./components/UserChatWidget";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { CopilotChat } from "./components/CopilotChat";

// ── Public pages — lazy loaded ────────────────────────────────────────────
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const OurTeam = lazy(() => import("./pages/OurTeam"));
const Partners = lazy(() => import("./pages/Partners"));
const IndustryHealthcare = lazy(() => import("./pages/IndustryHealthcare"));
const IndustryFinancial = lazy(() => import("./pages/IndustryFinancial"));
const IndustryManufacturing = lazy(() => import("./pages/IndustryManufacturing"));
const IndustryRetail = lazy(() => import("./pages/IndustryRetail"));
const IndustryGovernment = lazy(() => import("./pages/IndustryGovernment"));
const IndustryEducation = lazy(() => import("./pages/IndustryEducation"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Services = lazy(() => import("./pages/Services"));
const ManagedITTampa = lazy(() => import("./pages/ManagedITTampa"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ROICalculatorPage = lazy(() => import("./pages/ROICalculatorPage"));
const HelpdeskPricingPage = lazy(() => import("./pages/HelpdeskPricing"));
const AIStrategicBriefingPage = lazy(() => import("./pages/AIStrategicBriefingPage"));
const CaseStudiesPage = lazy(() => import("./pages/CaseStudiesPage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const ContactHarry = lazy(() => import("./pages/ContactHarry"));
const ContactCard = lazy(() => import("./pages/ContactCard"));
const KBPublic = lazy(() => import("./pages/KBPublic"));

// ── Helpdesk (customer-facing) — lazy loaded ─────────────────────────────
const HelpDesk = lazy(() => import("./pages/HelpDesk"));
const HelpdeskDashboard = lazy(() => import("./pages/HelpdeskDashboard"));
const CreateTicket = lazy(() => import("./pages/CreateTicket"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const TicketFeedback = lazy(() => import("./pages/TicketFeedback"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const HelpdeskAgentGuide = lazy(() => import("./pages/HelpdeskAgentGuide"));

// ── Auth pages — lazy loaded ──────────────────────────────────────────────
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const LogoutConfirmation = lazy(() => import("./pages/LogoutConfirmation"));

// ── Meeting management — lazy loaded ─────────────────────────────────────
const CancelMeeting = lazy(() => import("./pages/CancelMeeting"));
const RescheduleMeeting = lazy(() => import("./pages/RescheduleMeeting"));

// ── Admin portal — lazy loaded (all behind ApprovalGuard) ────────────────
const AdminHome = lazy(() => import("./pages/AdminHome"));
const AdminHelpdeskPage = lazy(() => import("./pages/AdminHelpdeskPage"));
const AdminChatPage = lazy(() => import("./pages/AdminChatPage"));
const AdminAgentsPage = lazy(() => import("./pages/AdminAgentsPage"));
const AdminNotificationsPage = lazy(() => import("./pages/AdminNotificationsPage"));
const AdminBlogPage = lazy(() => import("./pages/AdminBlogPage"));
const AdminNewsletterPage = lazy(() => import("./pages/AdminNewsletterPage"));
const AdminMetricsPage = lazy(() => import("./pages/AdminMetricsPage"));
const AdminAccountsPage = lazy(() => import("./pages/AdminAccountsPage"));
const AdminInvitesPage = lazy(() => import("./pages/AdminInvitesPage"));
const AdminEmailPage = lazy(() => import("./pages/AdminEmailPage"));
const AdminPreferencesPage = lazy(() => import("./pages/AdminPreferencesPage"));
const AdminEmailDigestPage = lazy(() => import("./pages/AdminEmailDigestPage"));
const AdminGuidePage = lazy(() => import("./pages/AdminGuidePage"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const AdminKbGenerationPage = lazy(() => import("./pages/AdminKbGenerationPage"));
const AdminSocialPage = lazy(() => import("./pages/AdminSocialPage"));
const AdminLeadsPage = lazy(() => import("./pages/AdminLeadsPage"));
const AdminContactsPage = lazy(() => import("./pages/AdminContactsPage"));
const AdminCannedResponsesPage = lazy(() => import("./pages/AdminCannedResponsesPage"));
const AdminClosedTicketsReportPage = lazy(() => import("./pages/AdminClosedTicketsReportPage"));
const AdminHelpdeskMetricsPage = lazy(() => import("./pages/AdminHelpdeskMetricsPage"));
const AdminAgentDashboardPage = lazy(() => import("./pages/AdminAgentDashboardPage"));
const AdminCopilot = lazy(() => import("./pages/AdminCopilot"));
const AdminCopilotM365 = lazy(() => import("./pages/AdminCopilotM365"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminSurveysPage = lazy(() => import("./pages/AdminSurveysPage"));
const AdminWorkloadPage = lazy(() => import("./pages/AdminWorkloadPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const AdminServiceHealthMonitoring = lazy(() => import("./pages/AdminServiceHealthMonitoring"));
const AdminM365Health = lazy(() => import("./pages/AdminM365Health"));
const AdminTeamsChannelsPage = lazy(() => import("./pages/AdminTeamsChannelsPage"));
const AdminEscalationPatternsPage = lazy(() => import("./pages/AdminEscalationPatternsPage"));

// ── Page loading fallback ─────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#00D4FF] text-sm font-medium tracking-wider">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <main id="main-content" className="skip-target">
        <Switch>
          {/* ── Public ── */}
          <Route path={"/"} component={Home} />
          <Route path={"/pricing"} component={Pricing} />
          <Route path={"/helpdesk-pricing"} component={HelpdeskPricingPage} />
          <Route path={"/roi-calculator"} component={ROICalculatorPage} />
          <Route path={"/AIStrategicBriefing"} component={AIStrategicBriefingPage} />
          <Route path={"/case-studies"} component={CaseStudiesPage} />
          <Route path={"/blog"} component={Blog} />
          <Route path={"/blog/:slug"} component={BlogDetail} />
          <Route path={"/about"}>{() => { window.location.replace("/about-us"); return null; }}</Route>
          <Route path={"/about-us"} component={AboutUs} />
          <Route path={"/our-team"} component={OurTeam} />
          <Route path={"/partners"} component={Partners} />
          <Route path={"/services"} component={Services} />
          <Route path={"/services/:slug"} component={ServiceDetail} />
          <Route path={"/managed-it-services-tampa"} component={ManagedITTampa} />
          {/* Industries */}
          <Route path={"/industries/healthcare"} component={IndustryHealthcare} />
          <Route path={"/industries/financial"} component={IndustryFinancial} />
          <Route path={"/industries/manufacturing"} component={IndustryManufacturing} />
          <Route path={"/industries/retail"} component={IndustryRetail} />
          <Route path={"/industries/government"} component={IndustryGovernment} />
          <Route path={"/industries/education"} component={IndustryEducation} />
          {/* Legal */}
          <Route path={"/privacy-policy"} component={PrivacyPolicy} />
          <Route path={"/terms-of-service"} component={TermsOfService} />
          {/* Contact */}
          <Route path={"/contact"} component={Contact} />
          <Route path={"/hh"} component={ContactHarry} />
          <Route path={"/contact-card"} component={ContactCard} />
          {/* KB Public */}
          <Route path={"/kb"} component={KBPublic} />
          <Route path={"/kb/:slug"} component={KBPublic} />
          {/* ── Helpdesk (customer-facing) ── */}
          <Route path={"/helpdesk"} component={HelpDesk} />
          <Route path={"/helpdesk/dashboard"} component={HelpdeskDashboard} />
          <Route path={"/helpdesk/create-ticket"} component={CreateTicket} />
          <Route path={"/helpdesk/ticket/:id"} component={TicketDetail} />
          <Route path={"/helpdesk/ticket/:id/feedback"} component={TicketFeedback} />
          <Route path={"/helpdesk/profile"} component={UserProfile} />
          <Route path={"/helpdesk/agent-guide"} component={HelpdeskAgentGuide} />
          {/* ── Auth ── */}
          <Route path={"/accept-invite"} component={AcceptInvite} />
          <Route path={"/logout"} component={LogoutConfirmation} />
          {/* ── Meeting management ── */}
          <Route path={"/cancel-meeting/:token"} component={CancelMeeting} />
          <Route path={"/reschedule-meeting/:token"} component={RescheduleMeeting} />
          {/* ── Admin Portal ── */}
          <Route path={"/admin"}>{() => <ApprovalGuard><AdminHome /></ApprovalGuard>}</Route>
          <Route path={"/admin/home"}>{() => <ApprovalGuard><AdminHome /></ApprovalGuard>}</Route>
          {/* Operations */}
          <Route path={"/admin/helpdesk"}>{() => <ApprovalGuard><AdminHelpdeskPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/chat"}>{() => <ApprovalGuard><AdminChatPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/agents"}>{() => <ApprovalGuard><AdminAgentsPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/notifications"}>{() => <ApprovalGuard><AdminNotificationsPage /></ApprovalGuard>}</Route>
          {/* Content */}
          <Route path={"/admin/blog"}>{() => <ApprovalGuard><AdminBlogPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/newsletter"}>{() => <ApprovalGuard><AdminNewsletterPage /></ApprovalGuard>}</Route>
          {/* Overview */}
          <Route path={"/admin/metrics"}>{() => <ApprovalGuard><AdminMetricsPage /></ApprovalGuard>}</Route>
          {/* Customers */}
          <Route path={"/admin/accounts"}>{() => <ApprovalGuard><AdminAccountsPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/invites"}>{() => <ApprovalGuard><AdminInvitesPage /></ApprovalGuard>}</Route>
          {/* Email */}
          <Route path={"/admin/email"}>{() => <ApprovalGuard><AdminEmailPage /></ApprovalGuard>}</Route>
          {/* Settings */}
          <Route path={"/admin/preferences"}>{() => <ApprovalGuard><AdminPreferencesPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/email-digest"}>{() => <ApprovalGuard><AdminEmailDigestPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/guide"}>{() => <ApprovalGuard><AdminGuidePage /></ApprovalGuard>}</Route>
          {/* Knowledge Base */}
          <Route path={"/admin/kb"}>{() => <ApprovalGuard><KnowledgeBase /></ApprovalGuard>}</Route>
          <Route path={"/admin/kb-generation"}>{() => <ApprovalGuard><AdminKbGenerationPage /></ApprovalGuard>}</Route>
          {/* Social Publishing Hub */}
          <Route path={"/admin/social"}>{() => <ApprovalGuard><AdminSocialPage /></ApprovalGuard>}</Route>
          {/* Leads & CRM */}
          <Route path={"/admin/leads"}>{() => <ApprovalGuard><AdminLeadsPage /></ApprovalGuard>}</Route>
          {/* Contact Submissions */}
          <Route path={"/admin/contacts"}>{() => <ApprovalGuard><AdminContactsPage /></ApprovalGuard>}</Route>
          {/* Canned Responses */}
          <Route path={"/admin/canned-responses"}>{() => <ApprovalGuard><AdminCannedResponsesPage /></ApprovalGuard>}</Route>
          {/* Closed Tickets Report */}
          <Route path={"/admin/closed-tickets"}>{() => <ApprovalGuard><AdminClosedTicketsReportPage /></ApprovalGuard>}</Route>
          {/* Helpdesk Metrics Dashboard */}
          <Route path={"/admin/helpdesk-metrics"}>{() => <ApprovalGuard><AdminHelpdeskMetricsPage /></ApprovalGuard>}</Route>
          {/* Real-Time Dashboard */}
          <Route path={"/admin/dashboard"}>{() => <ApprovalGuard><Dashboard /></ApprovalGuard>}</Route>
          {/* Agent Dashboard */}
          <Route path={"/admin/agent-dashboard"}>{() => <ApprovalGuard><AdminAgentDashboardPage /></ApprovalGuard>}</Route>
          {/* Copilot for M365 */}
          <Route path={"/admin/copilot"}>{() => <ApprovalGuard><AdminCopilot /></ApprovalGuard>}</Route>
          {/* Copilot M365 Intelligence */}
          <Route path={"/admin/copilot-m365"}>{() => <ApprovalGuard><AdminCopilotM365 /></ApprovalGuard>}</Route>
          {/* Analytics */}
          <Route path={"/admin/surveys"}>{() => <ApprovalGuard><AdminSurveysPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/workload"}>{() => <ApprovalGuard><AdminWorkloadPage /></ApprovalGuard>}</Route>
          {/* Settings & Users */}
          <Route path={"/admin/users"}>{() => <ApprovalGuard><AdminUsersPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/settings"}>{() => <ApprovalGuard><AdminSettingsPage /></ApprovalGuard>}</Route>
          {/* Service Health Monitoring */}
          <Route path={"/admin/service-health"}>{() => <ApprovalGuard><AdminServiceHealthMonitoring /></ApprovalGuard>}</Route>
          <Route path={"/admin/m365-health"}>{() => <ApprovalGuard><AdminM365Health /></ApprovalGuard>}</Route>
          {/* Teams Channels — per-client channel management */}
          <Route path={"/admin/teams-channels"}>{() => <ApprovalGuard><AdminTeamsChannelsPage /></ApprovalGuard>}</Route>
          <Route path={"/admin/escalation-patterns"}>{() => <ApprovalGuard><AdminEscalationPatternsPage /></ApprovalGuard>}</Route>
          {/* ── Fallback ── */}
          <Route path={"/404"} component={NotFound} />
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
  // Hide global widgets on admin/helpdesk/meeting pages
  const isMeetingPage = location.startsWith("/cancel-meeting") || location.startsWith("/reschedule-meeting");
  const isAdminPage = location.startsWith("/admin");
  const isHelpdeskPage = location.startsWith("/helpdesk");
  const hideWidgets = isMeetingPage || isAdminPage || isHelpdeskPage;
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[9999] focus:bg-[#00D4FF] focus:text-[#0A0E1A] focus:px-4 focus:py-2 focus:font-semibold"
          >
            Skip to main content
          </a>
          <Toaster />
          {!hideWidgets && <AnnouncementBar />}
          <Router />
          {!hideWidgets && <CookieConsent />}
          {!hideWidgets && <FloatingContactDial />}
          {!hideWidgets && <AIChatWidget />}
          {!hideWidgets && <UserChatWidget />}
          {!hideWidgets && <CopilotChat />}
          {!isAdminPage && !isMeetingPage && <PWAInstallPrompt />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
