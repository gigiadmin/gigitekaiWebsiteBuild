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

// StickyCTABar removed — Book Now bar disabled per user request

function Router() {
  return (
    <>
      <main id="main-content" className="skip-target">
        <Switch>
      {/* ── Public ── */}
      <Route path={"/"} component={Home} />
      <Route path={"/pricing"} component={Pricing} />
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

      {/* ── Meeting Management ── */}
      <Route path="/cancel-meeting" component={CancelMeeting} />
      <Route path="/reschedule-meeting" component={RescheduleMeeting} />

      {/* ── Contact page ── */}
      <Route path="/contact" component={Contact} />

      {/* ── Auth ── */}
      {/* OAuth login is handled automatically by useAuth hook in AdminLayout */}
      <Route path="/logout-confirmation" component={LogoutConfirmation} />
      {/* Redirect /login and /admin/login to /admin (OAuth handles auth) */}
      <Route path="/login">{() => { window.location.href = "/admin"; return null; }}</Route>
      <Route path="/admin/login">{() => { window.location.href = "/admin"; return null; }}</Route>

      {/* ── Unified Admin Portal ── */}
      {/* Dashboard home */}
      <Route path={"/admin"} component={AdminHome} />
      {/* Overview */}
      <Route path={"/admin/metrics"} component={AdminMetricsPage} />
      {/* Operations */}
      <Route path={"/admin/helpdesk"} component={AdminHelpdeskPage} />
      <Route path={"/admin/chat"} component={AdminChatPage} />
      <Route path={"/admin/agents"} component={AdminAgentsPage} />
      <Route path={"/admin/notifications"} component={AdminNotificationsPage} />
      {/* Content */}
      <Route path={"/admin/blog"} component={AdminBlogPage} />
      <Route path={"/admin/newsletter"} component={AdminNewsletterPage} />
      {/* Customers */}
      <Route path={"/admin/accounts"} component={AdminAccountsPage} />
      <Route path={"/admin/invites"} component={AdminInvitesPage} />
      {/* Email */}
      <Route path={"/admin/email"} component={AdminEmailPage} />
      {/* Settings */}
      <Route path={"/admin/preferences"} component={AdminPreferencesPage} />
      <Route path={"/admin/email-digest"} component={AdminEmailDigestPage} />
      <Route path={"/admin/guide"} component={AdminGuidePage} />
      {/* Knowledge Base */}
      <Route path={"/admin/kb"} component={KnowledgeBase} />
      {/* Social Publishing Hub */}
      <Route path={"/admin/social"} component={AdminSocialPage} />
      {/* Leads & CRM */}
      <Route path={"/admin/leads"} component={AdminLeadsPage} />
      {/* Contact Submissions */}
      <Route path={"/admin/contacts"} component={AdminContactsPage} />
      {/* Canned Responses */}
      <Route path={"/admin/canned-responses"} component={AdminCannedResponsesPage} />
      {/* Closed Tickets Report */}
      <Route path={"/admin/closed-tickets"} component={AdminClosedTicketsReportPage} />
      {/* Helpdesk Metrics Dashboard */}
      <Route path={"/admin/helpdesk-metrics"} component={AdminHelpdeskMetricsPage} />

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
          {!isAdminPage && !isMeetingPage && <PWAInstallPrompt />}
          {/* ExitIntentPopup disabled - no guide provided */}
          {/* StickyCTABar removed */}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
