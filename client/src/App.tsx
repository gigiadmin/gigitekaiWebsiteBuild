import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public pages
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import Careers from "./pages/Careers";
import ServiceDetail from "./pages/ServiceDetail";
import Pricing from "./pages/Pricing";
import ROICalculatorPage from "./pages/ROICalculatorPage";
import HelpdeskPricingPage from "./pages/HelpdeskPricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Helpdesk (customer-facing)
import HelpDesk from "./pages/HelpDesk";
import HelpdeskDashboard from "./pages/HelpdeskDashboard";
import CreateTicket from "./pages/CreateTicket";
import TicketDetail from "./pages/TicketDetail";
import TicketFeedback from "./pages/TicketFeedback";
import UserProfile from "./pages/UserProfile";
import HelpdeskAgentGuide from "./pages/HelpdeskAgentGuide";

// Auth
import AcceptInvite from "./pages/AcceptInvite";
import LogoutConfirmation from "./pages/LogoutConfirmation";
import ApprovalGuard from "./components/ApprovalGuard";

// ── Unified Admin Portal ──────────────────────────────────────────────────────
// Dashboard home
import AdminHome from "./pages/AdminHome";
// Operations
import AdminHelpdeskPage from "./pages/AdminHelpdeskPage";
import AdminChatPage from "./pages/AdminChatPage";
import AdminAgentsPage from "./pages/AdminAgentsPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
// Content
import AdminBlogPage from "./pages/AdminBlogPage";
import AdminNewsletterPage from "./pages/AdminNewsletterPage";
// Overview
import AdminMetricsPage from "./pages/AdminMetricsPage";
// Customers
import AdminAccountsPage from "./pages/AdminAccountsPage";
import AdminInvitesPage from "./pages/AdminInvitesPage";
import AdminEmailPage from "./pages/AdminEmailPage";
// Settings
import AdminPreferencesPage from "./pages/AdminPreferencesPage";
import AdminEmailDigestPage from "./pages/AdminEmailDigestPage";
import AdminGuidePage from "./pages/AdminGuidePage";
import KnowledgeBase from "./pages/KnowledgeBase";
import AdminSocialPage from "./pages/AdminSocialPage";
import AdminLeadsPage from "./pages/AdminLeadsPage";
import AdminContactsPage from "./pages/AdminContactsPage";
import AdminCannedResponsesPage from "./pages/AdminCannedResponsesPage";
import AdminClosedTicketsReportPage from "./pages/AdminClosedTicketsReportPage";
import AdminHelpdeskMetricsPage from "./pages/AdminHelpdeskMetricsPage";
import AdminAgentDashboardPage from "./pages/AdminAgentDashboardPage";
import AdminCopilot from "./pages/AdminCopilot";
import AdminCopilotM365 from "./pages/AdminCopilotM365";
import KBPublic from "./pages/KBPublic";
// ─────────────────────────────────────────────────────────────────────────────

// Meeting management
import CancelMeeting from "./pages/CancelMeeting";
import RescheduleMeeting from "./pages/RescheduleMeeting";

// Contact page
import Contact from "./pages/Contact";

// Widgets
import AIChatWidget from "./components/AIChatWidget";
import UserChatWidget from "./components/UserChatWidget";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { CopilotChat } from "./components/CopilotChat";
// ChatTriggerManager removed per user request - Start Chat popup disabled
// StickyCTABar removed per user request - Book Now bar disabled

function Router() {
  return (
    <>
      <main id="main-content" className="skip-target">
        <Switch>
      {/* ── Public ── */}
      <Route path={"/"} component={Home} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/helpdesk-pricing"} component={HelpdeskPricingPage} />
      <Route path={"/roi-calculator"} component={ROICalculatorPage} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/:slug"} component={BlogDetail} />
      <Route path={"/about"} component={About} />
      <Route path={"/careers"} component={Careers} />
      <Route path={"/services/:slug"} component={ServiceDetail} />

      {/* ── Helpdesk (customer portal) ── */}
      <Route path={"/helpdesk"} component={HelpDesk} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/helpdesk/dashboard">{() => <ApprovalGuard><HelpdeskDashboard /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/tickets/new">{() => <ApprovalGuard><CreateTicket /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/tickets/:ticketId">{() => <ApprovalGuard><TicketDetail /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/feedback">{() => <ApprovalGuard><TicketFeedback /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/profile">{() => <ApprovalGuard><UserProfile /></ApprovalGuard>}</Route>
      <Route path={"/helpdesk/guide"} component={HelpdeskAgentGuide} />
      <Route path={"/kb"} component={KBPublic} />

      {/* ── Public KB ── */}
      <Route path={"/kb/:id"} component={KBPublic} />

      {/* ── Meeting Management ── */}
      <Route path="/cancel-meeting" component={CancelMeeting} />
      <Route path="/reschedule-meeting" component={RescheduleMeeting} />

      {/* ── Contact page ── */}
      <Route path={"/contact"} component={Contact} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/terms-of-service"} component={TermsOfService} />

      {/* ── Auth ── */}
      {/* OAuth login is handled automatically by useAuth hook in AdminLayout */}
      <Route path="/logout-confirmation" component={LogoutConfirmation} />
      {/* Redirect /login and /admin/login to /admin (OAuth handles auth) */}
      <Route path="/login">{() => { window.location.href = "/admin"; return null; }}</Route>
      <Route path="/admin/login">{() => { window.location.href = "/admin"; return null; }}</Route>

      {/* ── Unified Admin Portal ── */}
      {/* Dashboard home */}
      <Route path={"/admin"}>{() => <ApprovalGuard><AdminHome /></ApprovalGuard>}</Route>
      {/* Overview */}
      <Route path={"/admin/metrics"}>{() => <ApprovalGuard><AdminMetricsPage /></ApprovalGuard>}</Route>
      {/* Operations */}
      <Route path={"/admin/helpdesk"}>{() => <ApprovalGuard><AdminHelpdeskPage /></ApprovalGuard>}</Route>
      <Route path={"/admin/chat"}>{() => <ApprovalGuard><AdminChatPage /></ApprovalGuard>}</Route>
      <Route path={"/admin/agents"}>{() => <ApprovalGuard><AdminAgentsPage /></ApprovalGuard>}</Route>
      <Route path={"/admin/notifications"}>{() => <ApprovalGuard><AdminNotificationsPage /></ApprovalGuard>}</Route>
      {/* Content */}
      <Route path={"/admin/blog"}>{() => <ApprovalGuard><AdminBlogPage /></ApprovalGuard>}</Route>
      <Route path={"/admin/newsletter"}>{() => <ApprovalGuard><AdminNewsletterPage /></ApprovalGuard>}</Route>
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
      {/* Agent Dashboard */}
      <Route path={"/admin/agent-dashboard"}>{() => <ApprovalGuard><AdminAgentDashboardPage /></ApprovalGuard>}</Route>
      {/* Copilot for M365 */}
      <Route path={"/admin/copilot"}>{() => <ApprovalGuard><AdminCopilot /></ApprovalGuard>}</Route>
      {/* Copilot M365 Intelligence */}
      <Route path={"/admin/copilot-m365"}>{() => <ApprovalGuard><AdminCopilotM365 /></ApprovalGuard>}</Route>

      {/* ── Fallback ── */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
        </Switch>
      </main>
    </>
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
          <Router />
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
