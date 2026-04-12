import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
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
// ─────────────────────────────────────────────────────────────────────────────

// Widgets
import AIChatWidget from "./components/AIChatWidget";
import UserChatWidget from "./components/UserChatWidget";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { ExitIntentPopup } from "./components/ExitIntentPopup";
import { StickyCTABar } from "./components/StickyCTABar";

function Router() {
  return (
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

      {/* ── Auth ── */}
      <Route path={"/login"} component={Login} />
      <Route path={"/admin/login"} component={AdminLogin} />

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

      {/* ── Fallback ── */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Global event for AI-to-live-chat handoff coordination
export const HANDOFF_EVENT = "gigitekai:handoff-to-live-chat";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
          <AIChatWidget />
          <UserChatWidget />
          <PWAInstallPrompt />
          <ExitIntentPopup />
          <StickyCTABar />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
