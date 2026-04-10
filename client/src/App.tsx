import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import HelpDesk from "./pages/HelpDesk";
import HelpdeskDashboard from "./pages/HelpdeskDashboard";
import CreateTicket from "./pages/CreateTicket";
import TicketDetail from "./pages/TicketDetail";
import AdminPanel from "./pages/AdminPanel";
import AdminChat from "./pages/AdminChat";
import AdminNotifications from "./pages/AdminNotifications";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMetrics from "./pages/AdminMetrics";
import EmailDigestSettings from "./pages/EmailDigestSettings";
import TicketFeedback from "./pages/TicketFeedback";
import UserProfile from "./pages/UserProfile";
import Careers from "./pages/Careers";
import ServiceDetail from "./pages/ServiceDetail";
import AcceptInvite from "./pages/AcceptInvite";
import AIChatWidget from "./components/AIChatWidget";
import UserChatWidget from "./components/UserChatWidget";
import PWAInstallBanner from "./components/PWAInstallBanner";
import ApprovalGuard from "./components/ApprovalGuard";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/:id"} component={BlogDetail} />
      <Route path={"/about"} component={About} />
      <Route path={"/careers"} component={Careers} />
      <Route path={"/services/:slug"} component={ServiceDetail} />
      <Route path={"/helpdesk"} component={HelpDesk} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/helpdesk/dashboard">{() => <ApprovalGuard><HelpdeskDashboard /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/tickets/new">{() => <ApprovalGuard><CreateTicket /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/tickets/:ticketId">{(params) => <ApprovalGuard><TicketDetail /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/feedback">{() => <ApprovalGuard><TicketFeedback /></ApprovalGuard>}</Route>
      <Route path="/helpdesk/profile">{() => <ApprovalGuard><UserProfile /></ApprovalGuard>}</Route>
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/metrics"} component={AdminMetrics} />
      <Route path={"/admin/helpdesk"} component={AdminPanel} />
      <Route path={"admin/chat"} component={AdminChat} />
      <Route path={"admin/notifications"} component={AdminNotifications} />
      <Route path={"admin/email-digest"} component={EmailDigestSettings} />
      <Route path={"404"} component={NotFound} />
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
          <PWAInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
