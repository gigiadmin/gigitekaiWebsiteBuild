# Aria Command Center Overhaul Notes

## Current Architecture
- Frontend: `/home/ubuntu/gigitekai/client/src/pages/AriaCommandCenter.tsx` (~913 lines)
- Backend: `/home/ubuntu/gigitekai/server/routers/aria.ts` (~778 lines)
- M365 helpers: `/home/ubuntu/gigitekai/server/_core/m365Graph.ts` (getM365Users, getUserCalendarEvents, getUserRecentEmails, getUserOneDriveFiles, analyzeUserM365Activity, getOrganizationM365Stats)
- MSGraph helpers: `/home/ubuntu/gigitekai/server/_core/msgraph.ts` (getTeamsPresence, getEmailMetrics, getUpcomingEvents, getMailFlowComplaints, getMessageTraceData, getTeamsChannelMessages)

## Tasks Completed
- [x] Voice fixed to consistent MALE English voice (priority: Daniel/Aaron/Arthur > GB male > any English male)

## Tasks Remaining
1. Enhance backend system prompt with deep admin/M365/Azure context
2. Add M365 live data to Aria context (wire in m365Graph + msgraph helpers)
3. Improve mobile UI (compact header, quick action chips visible on mobile)
4. Add power features (quick commands, M365 status panel, navigation shortcuts)

## Backend System Prompt Location
- File: `server/routers/aria.ts` line 632-652
- Current prompt is basic - needs expansion with:
  - All admin page descriptions and capabilities
  - M365 workload knowledge (Exchange, Teams, SharePoint, Entra ID, Intune, Defender)
  - Azure resource management guidance
  - PowerShell command library
  - Troubleshooting workflows

## Admin Pages (from AdminApp.tsx routes):
/admin - Home
/admin/helpdesk - Ticket management
/admin/chat - Live chat
/admin/agents - Agent management
/admin/notifications - Notifications
/admin/blog - Blog management
/admin/newsletter - Newsletter
/admin/metrics - Master metrics
/admin/accounts - Client accounts
/admin/invites - User invites
/admin/email - Email management
/admin/preferences - Admin preferences
/admin/email-digest - Email digest
/admin/guide - Admin guide
/admin/kb - Knowledge base
/admin/kb-generation - AI KB generation
/admin/social - Social media
/admin/leads - Sales leads
/admin/contacts - Contacts
/admin/canned-responses - Canned responses
/admin/closed-tickets - Closed ticket reports
/admin/agent-dashboard - Agent performance
/admin/agent-leaderboard - Agent leaderboard
/admin/copilot - Copilot
/admin/copilot-m365 - M365 Copilot
/admin/surveys - Surveys
/admin/workload - Agent workload
/admin/users - User management
/admin/settings - Settings
/admin/service-health - Service health monitoring
/admin/m365-health - M365 health status
/admin/teams-channels - Teams channels
/admin/escalation-patterns - Escalation patterns
/admin/ms-learn-sync - MS Learn sync
/admin/call-review - Call review
/admin/demo-leads - Demo leads
/admin/kb-analytics - KB analytics
/admin/recordings - Call recordings
/admin/sms-campaigns - SMS campaigns
/admin/hub - Admin hub
/admin/jira - Jira integration
/admin/sla - SLA dashboard
/admin/satisfaction - CSAT dashboard
/admin/scorecard - Performance scorecard
/admin/uptime - Uptime monitoring
/admin/xero - Xero accounting
/admin/client-onboarding - Client onboarding
/admin/search-index - Search index
/admin/dashboard - Dashboard
/admin/team-members - Team members
/admin/audit - Audit logs
/admin/call-quality - Call quality
/admin/contact-center - Contact center
/admin/command-center - IT command center
/admin/search - Aria Command Center
/admin/dns-checker - DNS checker
/admin/email-diagnostics - Email diagnostics
/admin/form-submissions - Form submissions
/admin/free-audits - Free audits
/admin/roi - ROI dashboard

## Mobile UI Issues
- Top bar has too many controls cramped together
- Status boxes hidden on mobile (good) but no quick actions visible
- Need compact mobile header with collapsible settings
- Need quick action chips/buttons visible on mobile for common tasks
