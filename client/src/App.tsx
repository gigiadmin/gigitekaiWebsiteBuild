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
import Careers from "./pages/Careers";
import ServiceDetail from "./pages/ServiceDetail";
import AIChatWidget from "./components/AIChatWidget";
import UserChatWidget from "./components/UserChatWidget";
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
      <Route path={"/helpdesk/dashboard"} component={HelpdeskDashboard} />
      <Route path={"/helpdesk/tickets/new"} component={CreateTicket} />
      <Route path={"/helpdesk/tickets/:ticketId"} component={TicketDetail} />
      <Route path={"/admin/helpdesk"} component={AdminPanel} />
      <Route path={"/admin/chat"} component={AdminChat} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
