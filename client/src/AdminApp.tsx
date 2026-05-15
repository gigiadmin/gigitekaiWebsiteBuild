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
const AdminMsLearnSyncPage = lazy(() => import("./pages/AdminMsLearnSyncPage"));
const AdminCallReviewPage = lazy(() => import("./pages/AdminCallReviewPage"));
const AdminContactCenterDashboard = lazy(() => import("./pages/AdminContactCenterDashboard"));
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
const AdminClientOnboardingPage = lazy(() => import("./pages/AdminClientOnboardingPage"));

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

export default function AdminApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/admin" component={() => <ApprovalGuard><AdminHome /></ApprovalGuard>} />
              <Route path="/admin/helpdesk" component={() => <ApprovalGuard><AdminPanelPage /></ApprovalGuard>} />
              <Route path="/admin/chat" component={() => <ApprovalGuard><AdminChatPage /></ApprovalGuard>} />
              <Route path="/admin/agents" component={() => <ApprovalGuard><AdminAgentsPage /></ApprovalGuard>} />
              <Route path="/admin/notifications" component={() => <ApprovalGuard><AdminNotificationsPage /></ApprovalGuard>} />
              <Route path="/admin/blog" component={() => <ApprovalGuard><AdminBlogPage /></ApprovalGuard>} />
              <Route path="/admin/newsletter" component={() => <ApprovalGuard><AdminNewsletterPage /></ApprovalGuard>} />
              <Route path="/admin/metrics" component={() => <ApprovalGuard><AdminMetricsPage /></ApprovalGuard>} />
              <Route path="/admin/accounts" component={() => <ApprovalGuard><AdminAccountsPage /></ApprovalGuard>} />
              <Route path="/admin/invites" component={() => <ApprovalGuard><AdminInvitesPage /></ApprovalGuard>} />
              <Route path="/admin/email" component={() => <ApprovalGuard><AdminEmailPage /></ApprovalGuard>} />
              <Route path="/admin/preferences" component={() => <ApprovalGuard><AdminPreferencesPage /></ApprovalGuard>} />
              <Route path="/admin/email-digest" component={() => <ApprovalGuard><AdminEmailDigestPage /></ApprovalGuard>} />
              <Route path="/admin/guide" component={() => <ApprovalGuard><AdminGuidePage /></ApprovalGuard>} />
              <Route path="/admin/kb" component={() => <ApprovalGuard><KnowledgeBase /></ApprovalGuard>} />
              <Route path="/admin/kb-generation" component={() => <ApprovalGuard><AdminKbGenerationPage /></ApprovalGuard>} />
              <Route path="/admin/social" component={() => <ApprovalGuard><AdminSocialPage /></ApprovalGuard>} />
              <Route path="/admin/leads" component={() => <ApprovalGuard><AdminLeadsPage /></ApprovalGuard>} />
              <Route path="/admin/contacts" component={() => <ApprovalGuard><AdminContactsPage /></ApprovalGuard>} />
              <Route path="/admin/canned-responses" component={() => <ApprovalGuard><AdminCannedResponsesPage /></ApprovalGuard>} />
              <Route path="/admin/closed-tickets" component={() => <ApprovalGuard><AdminClosedTicketsReportPage /></ApprovalGuard>} />
              <Route path="/admin/helpdesk-metrics" component={() => <ApprovalGuard><AdminHelpdeskMetricsPage /></ApprovalGuard>} />
              <Route path="/admin/agent-dashboard" component={() => <ApprovalGuard><AdminAgentDashboardPage /></ApprovalGuard>} />
              <Route path="/admin/agent-leaderboard" component={() => <ApprovalGuard><AdminAgentLeaderboard /></ApprovalGuard>} />
              <Route path="/admin/copilot" component={() => <ApprovalGuard><AdminCopilot /></ApprovalGuard>} />
              <Route path="/admin/copilot-m365" component={() => <ApprovalGuard><AdminCopilotM365 /></ApprovalGuard>} />
              <Route path="/admin/dashboard" component={() => <ApprovalGuard><Dashboard /></ApprovalGuard>} />
              <Route path="/admin/surveys" component={() => <ApprovalGuard><AdminSurveysPage /></ApprovalGuard>} />
              <Route path="/admin/sla" component={() => <ApprovalGuard><AdminSLADashboardPage /></ApprovalGuard>} />
              <Route path="/admin/satisfaction" component={() => <ApprovalGuard><AdminSatisfactionDashboardPage /></ApprovalGuard>} />
              <Route path="/admin/scorecard" component={() => <ApprovalGuard><AdminScorecardDashboardPage /></ApprovalGuard>} />
              <Route path="/admin/workload" component={() => <ApprovalGuard><AdminWorkloadPage /></ApprovalGuard>} />
              <Route path="/admin/users" component={() => <ApprovalGuard><AdminUsersPage /></ApprovalGuard>} />
              <Route path="/admin/team-members" component={() => <ApprovalGuard><TeamMembersEnhanced /></ApprovalGuard>} />
              <Route path="/admin/settings" component={() => <ApprovalGuard><AdminSettingsPage /></ApprovalGuard>} />
              <Route path="/admin/service-health" component={() => <ApprovalGuard><AdminServiceHealthMonitoring /></ApprovalGuard>} />
              <Route path="/admin/m365-health" component={() => <ApprovalGuard><AdminM365Health /></ApprovalGuard>} />
              <Route path="/admin/teams-channels" component={() => <ApprovalGuard><AdminTeamsChannelsPage /></ApprovalGuard>} />
              <Route path="/admin/escalation-patterns" component={() => <ApprovalGuard><AdminEscalationPatternsPage /></ApprovalGuard>} />
              <Route path="/admin/ms-learn-sync" component={() => <ApprovalGuard><AdminMsLearnSyncPage /></ApprovalGuard>} />
              <Route path="/admin/call-review" component={() => <ApprovalGuard><AdminCallReviewPage /></ApprovalGuard>} />
              <Route path="/admin/contact-center" component={() => <ApprovalGuard><AdminContactCenterDashboard /></ApprovalGuard>} />
              <Route path="/admin/contact-center-dashboard" component={() => <ApprovalGuard><AdminContactCenterDashboard /></ApprovalGuard>} />
              <Route path="/admin/demo-leads" component={() => <ApprovalGuard><AdminDemoLeadsPage /></ApprovalGuard>} />
              <Route path="/admin/client-onboarding" component={() => <ApprovalGuard><AdminClientOnboardingPage /></ApprovalGuard>} />
              <Route path="/admin/kb-analytics" component={() => <ApprovalGuard><AdminKBAnalytics /></ApprovalGuard>} />
              <Route path="/admin/recordings" component={() => <ApprovalGuard><AdminRecordingsPage /></ApprovalGuard>} />
              <Route path="/admin/sms-campaigns" component={() => <ApprovalGuard><AdminSmsCampaignsPage /></ApprovalGuard>} />
              <Route path="/admin/hub" component={() => <ApprovalGuard><AdminHubPage /></ApprovalGuard>} />
              <Route path="/admin/jira" component={() => <ApprovalGuard><AdminJiraDashboard /></ApprovalGuard>} />
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
