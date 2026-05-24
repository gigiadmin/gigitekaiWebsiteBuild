/**
 * AdminApp.tsx — Separate admin portal app
 * This file is only loaded when accessing /admin routes
 * Keeps admin code out of the public bundle (saves 1,012 KiB)
 */

import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ApprovalGuard from "./components/ApprovalGuard";
import AdminLayout from "./components/AdminLayout";

// Admin portal pages — lazy loaded
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
const AdminAgentLeaderboard = lazy(() => import("./pages/AdminAgentLeaderboard"));
const AdminCopilot = lazy(() => import("./pages/AdminCopilot"));
const AdminCopilotM365 = lazy(() => import("./pages/AdminCopilotM365"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminSurveysPage = lazy(() => import("./pages/AdminSurveysPage"));
const AdminWorkloadPage = lazy(() => import("./pages/AdminWorkloadPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const TeamMembersEnhanced = lazy(() => import("./pages/TeamMembersEnhanced"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const AdminServiceHealthMonitoring = lazy(() => import("./pages/AdminServiceHealthMonitoring"));
const AdminM365Health = lazy(() => import("./pages/AdminM365Health"));
const AdminTeamsChannelsPage = lazy(() => import("./pages/AdminTeamsChannelsPage"));
const AdminEscalationPatternsPage = lazy(() => import("./pages/AdminEscalationPatternsPage"));
const AdminAuditDashboard = lazy(() => import("./pages/AdminAuditDashboard"));
const AdminMsLearnSyncPage = lazy(() => import("./pages/AdminMsLearnSyncPage"));
const AdminCallReviewPage = lazy(() => import("./pages/AdminCallReviewPage"));
const AdminCallQualityPage = lazy(() => import("./pages/AdminCallQualityPage"));
const AdminContactCenterDashboardWrapper = lazy(() => import("./pages/AdminContactCenterDashboardWrapper"));
const AdminDemoLeadsPage = lazy(() => import("./pages/AdminDemoLeadsPage"));
const AdminClientOnboarding = lazy(() => import("./pages/AdminClientOnboarding"));
const AdminKBAnalytics = lazy(() => import("./pages/AdminKBAnalytics"));
const AdminRecordingsPage = lazy(() => import("./pages/AdminRecordingsPage"));
const AdminSmsCampaignsPage = lazy(() => import("./pages/AdminSmsCampaignsPage"));
const AdminHubPage = lazy(() => import("./pages/AdminHubPage"));
const AdminJiraDashboard = lazy(() => import("./pages/AdminJiraDashboard"));
const AdminPanelPage = lazy(() => import("./pages/AdminPanelPage"));
const AdminSLADashboardPage = lazy(() => import("./pages/AdminSLADashboardPage"));
const AdminSatisfactionDashboardPage = lazy(() => import("./pages/AdminSatisfactionDashboardPage"));
const AdminScorecardDashboardPage = lazy(() => import("./pages/AdminScorecardDashboardPage"));
const AdminUptimeRobotDashboard = lazy(() => import("./pages/AdminUptimeRobotDashboard"));
const AdminUptimeRobotDetailPagePage = lazy(() => import("./pages/AdminUptimeRobotDetailPagePage"));
const AdminClientOnboardingPage = lazy(() => import("./pages/AdminClientOnboardingPage"));
const WebPricingPage = lazy(() => import("./pages/WebPricingPage"));
const AdminXero = lazy(() => import("./pages/AdminXero"));
const AdminROIDashboard = lazy(() => import("./pages/AdminROIDashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-12 h-12 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">Gigitek</span>
          <span className="text-[#00D4FF] font-bold text-lg tracking-tight">AI</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to wrap pages with both ApprovalGuard and AdminLayout
 * This ensures every admin page has the unified navigation menu
 */
function withAdminLayout(Component: React.ComponentType<any>, title?: string) {
  return () => (
    <ApprovalGuard>
      <AdminLayout title={title}>
        <Component />
      </AdminLayout>
    </ApprovalGuard>
  );
}

export default function AdminApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/admin" component={withAdminLayout(AdminHome, "Dashboard")} />
              <Route path="/admin/helpdesk" component={withAdminLayout(AdminPanelPage, "Helpdesk")} />
              <Route path="/admin/chat" component={withAdminLayout(AdminChatPage, "Chat")} />
              <Route path="/admin/agents" component={withAdminLayout(AdminAgentsPage, "Agents")} />
              <Route path="/admin/notifications" component={withAdminLayout(AdminNotificationsPage, "Notifications")} />
              <Route path="/admin/blog" component={withAdminLayout(AdminBlogPage, "Blog")} />
              <Route path="/admin/newsletter" component={withAdminLayout(AdminNewsletterPage, "Newsletter")} />
              <Route path="/admin/metrics" component={withAdminLayout(AdminMetricsPage, "Metrics")} />
              <Route path="/admin/accounts" component={withAdminLayout(AdminAccountsPage, "Accounts")} />
              <Route path="/admin/invites" component={withAdminLayout(AdminInvitesPage, "Invites")} />
              <Route path="/admin/email" component={withAdminLayout(AdminEmailPage, "Email")} />
              <Route path="/admin/preferences" component={withAdminLayout(AdminPreferencesPage, "Preferences")} />
              <Route path="/admin/email-digest" component={withAdminLayout(AdminEmailDigestPage, "Email Digest")} />
              <Route path="/admin/guide" component={withAdminLayout(AdminGuidePage, "Guide")} />
              <Route path="/admin/kb" component={withAdminLayout(KnowledgeBase, "Knowledge Base")} />
              <Route path="/admin/kb-generation" component={withAdminLayout(AdminKbGenerationPage, "KB Generation")} />
              <Route path="/admin/social" component={withAdminLayout(AdminSocialPage, "Social")} />
              <Route path="/admin/leads" component={withAdminLayout(AdminLeadsPage, "Leads")} />
              <Route path="/admin/contacts" component={withAdminLayout(AdminContactsPage, "Contacts")} />
              <Route path="/admin/canned-responses" component={withAdminLayout(AdminCannedResponsesPage, "Canned Responses")} />
              <Route path="/admin/closed-tickets" component={withAdminLayout(AdminClosedTicketsReportPage, "Closed Tickets")} />
              <Route path="/admin/helpdesk-metrics" component={withAdminLayout(AdminHelpdeskMetricsPage, "Helpdesk Metrics")} />
              <Route path="/admin/agent-dashboard" component={withAdminLayout(AdminAgentDashboardPage, "Agent Dashboard")} />
              <Route path="/admin/agent-leaderboard" component={withAdminLayout(AdminAgentLeaderboard, "Agent Leaderboard")} />
              <Route path="/admin/copilot" component={withAdminLayout(AdminCopilot, "Copilot")} />
              <Route path="/admin/copilot-m365" component={withAdminLayout(AdminCopilotM365, "Copilot M365")} />
              <Route path="/admin/dashboard" component={withAdminLayout(Dashboard, "Dashboard")} />
              <Route path="/admin/surveys" component={withAdminLayout(AdminSurveysPage, "Surveys")} />
              <Route path="/admin/sla" component={withAdminLayout(AdminSLADashboardPage, "SLA Dashboard")} />
              <Route path="/admin/satisfaction" component={withAdminLayout(AdminSatisfactionDashboardPage, "Satisfaction")} />
              <Route path="/admin/scorecard" component={withAdminLayout(AdminScorecardDashboardPage, "Scorecard")} />
              <Route path="/admin/workload" component={withAdminLayout(AdminWorkloadPage, "Workload")} />
              <Route path="/admin/users" component={withAdminLayout(AdminUsersPage, "Users")} />
              <Route path="/admin/team-members" component={withAdminLayout(TeamMembersEnhanced, "Team Members")} />
              <Route path="/admin/settings" component={withAdminLayout(AdminSettingsPage, "Settings")} />
              <Route path="/admin/service-health" component={withAdminLayout(AdminServiceHealthMonitoring, "Service Health")} />
              <Route path="/admin/m365-health" component={withAdminLayout(AdminM365Health, "M365 Health")} />
              <Route path="/admin/teams-channels" component={withAdminLayout(AdminTeamsChannelsPage, "Teams Channels")} />
              <Route path="/admin/escalation-patterns" component={withAdminLayout(AdminEscalationPatternsPage, "Escalation Patterns")} />
              <Route path="/admin/ms-learn-sync" component={withAdminLayout(AdminMsLearnSyncPage, "MS Learn Sync")} />
              <Route path="/admin/call-review" component={withAdminLayout(AdminCallReviewPage, "Call Review")} />
              <Route path="/admin/call-quality" component={withAdminLayout(AdminCallQualityPage, "Call Quality")} />
              <Route path="/admin/contact-center" component={withAdminLayout(AdminContactCenterDashboardWrapper, "Contact Center")} />
              <Route path="/admin/contact-center-dashboard" component={withAdminLayout(AdminContactCenterDashboardWrapper, "Contact Center")} />
              <Route path="/admin/demo-leads" component={withAdminLayout(AdminDemoLeadsPage, "Demo Leads")} />
              <Route path="/admin/client-onboarding" component={withAdminLayout(AdminClientOnboardingPage, "Client Onboarding")} />
              <Route path="/admin/kb-analytics" component={withAdminLayout(AdminKBAnalytics, "KB Analytics")} />
              <Route path="/admin/recordings" component={withAdminLayout(AdminRecordingsPage, "Recordings")} />
              <Route path="/admin/sms-campaigns" component={withAdminLayout(AdminSmsCampaignsPage, "SMS Campaigns")} />
              <Route path="/admin/hub" component={withAdminLayout(AdminHubPage, "Hub")} />
              <Route path="/admin/jira" component={withAdminLayout(AdminJiraDashboard, "Jira")} />
              <Route path="/admin/uptime/:monitorId" component={withAdminLayout(AdminUptimeRobotDetailPagePage, "Uptime Detail")} />
              <Route path="/admin/uptime" component={withAdminLayout(AdminUptimeRobotDashboard, "Uptime")} />
              <Route path="/admin/xero" component={withAdminLayout(AdminXero, "Xero")} />
              <Route path="/admin/roi" component={withAdminLayout(AdminROIDashboard, "ROI Dashboard")} />
              <Route path="/admin/audit" component={withAdminLayout(AdminAuditDashboard, "Audit")} />
              <Route path="/web-pricing" component={() => <WebPricingPage />} />
              <Route path="/:rest*" component={() => (
                <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-[#00D4FF] mb-4">404</h1>
                    <p className="text-white text-xl mb-8">Admin page not found</p>
                    <a href="/admin" className="bg-[#00D4FF] text-black px-6 py-2 rounded-lg font-semibold hover:bg-cyan-400 transition-colors">
                      Back to Admin Home
                    </a>
                  </div>
                </div>
              )} />
            </Switch>
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
