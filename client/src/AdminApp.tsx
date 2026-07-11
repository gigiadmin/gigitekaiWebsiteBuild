/**
 * AdminApp.tsx — Separate admin portal app
 * This file is only loaded when accessing /admin routes
 * Keeps admin code out of the public bundle (saves 1,012 KiB)
 */

import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import { useAriaShortcut } from "@/hooks/useAriaShortcut";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ApprovalGuard from "./components/ApprovalGuard";
import AdminLayout from "./components/AdminLayout";
import { LazyComponentWrapper } from "./components/LazyComponentWrapper";

// Admin portal pages — lazy loaded
const AdminHome = lazy(() => import("./pages/AdminHome"));
const AdminHelpdeskPage = lazy(() => import("./pages/AdminHelpdeskPage"));
const AdminChatPage = lazy(() => import("./pages/AdminChatPage"));
const AdminAgentsPage = lazy(() => import("./pages/AdminAgentsPage"));
const AdminNotificationsPage = lazy(() => import("./pages/AdminNotificationsPage"));
const AdminBlogPage = lazy(() => import("./pages/AdminBlogPage"));
const AdminNewsletterPage = lazy(() => import("./pages/AdminNewsletterPage"));
const MasterMetricsDashboard = lazy(() => import("./pages/MasterMetricsDashboard"));
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
const CommandCenterAdminDashboard = lazy(() => import("./pages/CommandCenterAdminDashboard"));
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
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const AdminTicketDetail = lazy(() => import("./pages/AdminTicketDetail"));
const AdminSearchIndexPage = lazy(() => import("./pages/AdminSearchIndexPage"));
const AriaCommandCenterAdmin = lazy(() => import("./pages/AriaCommandCenterDashboard"));
const AdminDNSChecker = lazy(() => import("./pages/AdminDNSChecker"));

const AdminEmailDiagnostics = lazy(() => import("./pages/EmailDiagnostics"));
const AdminFormSubmissions = lazy(() => import("./pages/AdminFormSubmissions"));

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
 * For pages that ALREADY have AdminLayout internally — wrap with ApprovalGuard only
 * This prevents the duplicate navigation menu issue
 */
function withApprovalOnly(Component: React.ComponentType<any>) {
  return () => (
    <LazyComponentWrapper>
      <ApprovalGuard>
        <AdminLayout>
          <Component />
        </AdminLayout>
      </ApprovalGuard>
    </LazyComponentWrapper>
  );
}

/**
 * For pages that do NOT have AdminLayout internally — wrap with both ApprovalGuard and AdminLayout
 * This ensures they still get the unified navigation menu
 */
function withAdminLayout(Component: React.ComponentType<any>, title?: string, noPadding?: boolean) {
  return () => (
    <LazyComponentWrapper>
      <ApprovalGuard>
        <AdminLayout title={title} noPadding={noPadding}>
          <Component />
        </AdminLayout>
      </ApprovalGuard>
    </LazyComponentWrapper>
  );
}

function AdminAppInner() {
  // Enable global ⌘K/Ctrl+K shortcut to launch Aria
  useAriaShortcut();

  return (
    <Switch>
              {/* Pages that ALREADY have AdminLayout internally — use withApprovalOnly */}
              <Route path="/admin" component={withApprovalOnly(AdminHome)} />
              <Route path="/admin/helpdesk/:ticketId" component={withApprovalOnly(AdminTicketDetail)} />
              <Route path="/admin/helpdesk" component={withApprovalOnly(AdminPanelPage)} />
              <Route path="/admin/chat" component={withApprovalOnly(AdminChatPage)} />
              <Route path="/admin/agents" component={withApprovalOnly(AdminAgentsPage)} />
              <Route path="/admin/notifications" component={withApprovalOnly(AdminNotificationsPage)} />
              <Route path="/admin/blog" component={withApprovalOnly(AdminBlogPage)} />
              <Route path="/admin/newsletter" component={withApprovalOnly(AdminNewsletterPage)} />

              <Route path="/admin/metrics" component={withApprovalOnly(MasterMetricsDashboard)} />
              <Route path="/admin/accounts" component={withApprovalOnly(AdminAccountsPage)} />
              <Route path="/admin/invites" component={withApprovalOnly(AdminInvitesPage)} />
              <Route path="/admin/email" component={withApprovalOnly(AdminEmailPage)} />
              <Route path="/admin/preferences" component={withApprovalOnly(AdminPreferencesPage)} />
              <Route path="/admin/email-digest" component={withApprovalOnly(AdminEmailDigestPage)} />
              <Route path="/admin/guide" component={withApprovalOnly(AdminGuidePage)} />
              <Route path="/admin/kb" component={withApprovalOnly(KnowledgeBase)} />
              <Route path="/admin/kb-generation" component={withApprovalOnly(AdminKbGenerationPage)} />
              <Route path="/admin/social" component={withApprovalOnly(AdminSocialPage)} />
              <Route path="/admin/leads" component={withApprovalOnly(AdminLeadsPage)} />
              <Route path="/admin/contacts" component={withApprovalOnly(AdminContactsPage)} />
              <Route path="/admin/canned-responses" component={withApprovalOnly(AdminCannedResponsesPage)} />
              <Route path="/admin/closed-tickets" component={withApprovalOnly(AdminClosedTicketsReportPage)} />
              {/* Redirect old helpdesk-metrics URL to unified metrics page */}
              <Route path="/admin/helpdesk-metrics" component={withApprovalOnly(MasterMetricsDashboard)} />
              <Route path="/admin/agent-dashboard" component={withApprovalOnly(AdminAgentDashboardPage)} />
              <Route path="/admin/agent-leaderboard" component={withApprovalOnly(AdminAgentLeaderboard)} />
              <Route path="/admin/copilot" component={withApprovalOnly(AdminCopilot)} />
              <Route path="/admin/copilot-m365" component={withApprovalOnly(AdminCopilotM365)} />
              <Route path="/admin/surveys" component={withApprovalOnly(AdminSurveysPage)} />
              <Route path="/admin/workload" component={withApprovalOnly(AdminWorkloadPage)} />
              <Route path="/admin/users" component={withApprovalOnly(AdminUsersPage)} />
              <Route path="/admin/settings" component={withApprovalOnly(AdminSettingsPage)} />
              <Route path="/admin/service-health" component={withApprovalOnly(AdminServiceHealthMonitoring)} />
              <Route path="/admin/m365-health" component={withApprovalOnly(AdminM365Health)} />
              <Route path="/admin/teams-channels" component={withApprovalOnly(AdminTeamsChannelsPage)} />
              <Route path="/admin/escalation-patterns" component={withApprovalOnly(AdminEscalationPatternsPage)} />
              <Route path="/admin/ms-learn-sync" component={withApprovalOnly(AdminMsLearnSyncPage)} />
              <Route path="/admin/call-review" component={withApprovalOnly(AdminCallReviewPage)} />
              <Route path="/admin/demo-leads" component={withApprovalOnly(AdminDemoLeadsPage)} />
              <Route path="/admin/kb-analytics" component={withApprovalOnly(AdminKBAnalytics)} />
              <Route path="/admin/recordings" component={withApprovalOnly(AdminRecordingsPage)} />
              <Route path="/admin/sms-campaigns" component={withApprovalOnly(AdminSmsCampaignsPage)} />
              <Route path="/admin/hub" component={withApprovalOnly(AdminHubPage)} />
              <Route path="/admin/jira" component={withApprovalOnly(AdminJiraDashboard)} />
              <Route path="/admin/sla" component={withApprovalOnly(AdminSLADashboardPage)} />
              <Route path="/admin/satisfaction" component={withApprovalOnly(AdminSatisfactionDashboardPage)} />
              <Route path="/admin/scorecard" component={withApprovalOnly(AdminScorecardDashboardPage)} />
              <Route path="/admin/uptime/:monitorId" component={withApprovalOnly(AdminUptimeRobotDetailPagePage)} />
              <Route path="/admin/uptime" component={withApprovalOnly(AdminUptimeRobotDashboard)} />
              <Route path="/admin/xero" component={withApprovalOnly(AdminXero)} />
              <Route path="/admin/client-onboarding" component={withApprovalOnly(AdminClientOnboardingPage)} />
              <Route path="/admin/search-index" component={withApprovalOnly(AdminSearchIndexPage)} />

              {/* Pages that do NOT have AdminLayout internally — use withAdminLayout */}
              <Route path="/admin/dashboard" component={withAdminLayout(Dashboard, "Dashboard")} />
              <Route path="/admin/team-members" component={withAdminLayout(TeamMembersEnhanced, "Team Members")} />
              <Route path="/admin/audit" component={withAdminLayout(AdminAuditDashboard, "Audit")} />
              <Route path="/admin/call-quality" component={withAdminLayout(AdminCallQualityPage, "Call Quality")} />
              <Route path="/admin/contact-center" component={withAdminLayout(AdminContactCenterDashboardWrapper, "Contact Center")} />
              <Route path="/admin/contact-center-dashboard" component={withAdminLayout(AdminContactCenterDashboardWrapper, "Contact Center")} />
              <Route path="/admin/command-center" component={withAdminLayout(CommandCenterAdminDashboard, "Command Center")} />
              <Route path="/admin/aria" component={withAdminLayout(AriaCommandCenterAdmin, "Aria Command Center", true)} />
              <Route path="/admin/search" component={withAdminLayout(AriaCommandCenterAdmin, "Aria Command Center", true)} />
              <Route path="/admin/dns-checker" component={withAdminLayout(AdminDNSChecker, "DNS Checker")} />
              <Route path="/admin/email-diagnostics" component={withAdminLayout(AdminEmailDiagnostics, "Email Diagnostics")} />
              <Route path="/admin/form-submissions" component={withAdminLayout(AdminFormSubmissions, "Form Submissions")} />
              <Route path="/admin/free-audits" component={withAdminLayout(AdminClientOnboarding, "Free Audits")} />
              <Route path="/admin/roi" component={withAdminLayout(AdminROIDashboard, "ROI Dashboard")} />

              {/* Non-admin routes */}
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
  );
}

export default function AdminApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Suspense fallback={<PageLoader />}>
            <AdminAppInner />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
