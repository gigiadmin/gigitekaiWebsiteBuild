# Copilot for Microsoft 365 Integration

## Overview

Copilot for Microsoft 365 provides AI-powered intelligence for analyzing organizational Microsoft 365 usage, user activity, and generating actionable insights. This integration connects to Microsoft Graph API to access real-time data from Exchange, Teams, SharePoint, and OneDrive.

## Architecture

### Components

1. **M365 Graph API Layer** (`server/_core/m365Graph.ts`)
   - Token management with client credentials flow
   - User listing and activity retrieval
   - Calendar, email, and file access
   - LLM-powered activity analysis

2. **Copilot M365 Router** (`server/routers/copilotM365.ts`)
   - tRPC endpoints for M365 data access
   - Admin-only access control
   - Error handling and response formatting

3. **Admin Dashboard** (`client/src/pages/AdminCopilotM365.tsx`)
   - Organization statistics overview
   - User search and selection
   - Activity visualization (calendar, emails, files)
   - AI-generated insights and recommendations

## Features

### Organization Statistics
- Total licensed users
- Active users (last 30 days)
- Teams usage metrics
- Exchange mailbox usage
- SharePoint adoption rates

### User Activity Analysis
- **Calendar Events**: Upcoming meetings and scheduling patterns
- **Email Analysis**: Recent messages and communication trends
- **File Activity**: OneDrive/SharePoint file access and modifications
- **AI Insights**: LLM-powered analysis of productivity patterns
- **Recommendations**: Actionable suggestions for optimization

## API Endpoints

### Organization Level
```typescript
// Get organization-wide M365 statistics
copilotM365.getOrgStats()
// Returns: { totalUsers, activeUsers, teamsUsage, exchangeUsage, sharepointUsage }

// List all M365 users
copilotM365.listUsers()
// Returns: Array of users with id, displayName, userPrincipalName, mail
```

### User Level
```typescript
// Get user's calendar events
copilotM365.getUserCalendar({ userEmail: string })
// Returns: Array of calendar events

// Get user's recent emails
copilotM365.getUserEmails({ userEmail: string })
// Returns: Array of recent messages

// Get user's OneDrive files
copilotM365.getUserFiles({ userEmail: string })
// Returns: Array of files with metadata

// Analyze user's M365 activity
copilotM365.analyzeUserActivity({ userEmail: string })
// Returns: { summary, insights[], recommendations[] }
```

## Authentication

### Prerequisites
- Azure AD App Registration with Microsoft Graph permissions
- Application permissions (not delegated):
  - `User.Read.All`
  - `Mail.Read`
  - `Calendar.Read`
  - `Files.Read.All`
  - `Organization.Read.All`

### Environment Variables
```env
MS_GRAPH_TENANT_ID=your-tenant-id
MS_GRAPH_CLIENT_ID=your-client-id
MS_GRAPH_CLIENT_SECRET=your-client-secret
```

### Token Management
- Uses client credentials OAuth 2.0 flow
- Token caching with 1-hour expiration
- Automatic token refresh on expiration

## Usage

### Accessing the Dashboard
1. Navigate to `/admin/copilot-m365`
2. View organization statistics on Overview tab
3. Select a user from Users tab to view their activity
4. Review AI-generated insights on Insights tab

### Programmatic Access
```typescript
import { trpc } from "@/lib/trpc";

// Get org stats
const { data } = trpc.copilotM365.getOrgStats.useQuery();

// Get user activity
const { data } = trpc.copilotM365.analyzeUserActivity.useQuery(
  { userEmail: "user@company.com" },
  { enabled: !!userEmail }
);
```

## Testing

Run the test suite:
```bash
pnpm test server/routers/copilotM365.test.ts
```

Test coverage includes:
- Organization statistics retrieval
- User listing and filtering
- Calendar event access
- Email analysis
- File activity tracking
- Activity analysis and insights
- Error handling
- Admin access control

## Performance Considerations

1. **Token Caching**: Reduces OAuth calls by caching tokens for 1 hour
2. **Pagination**: Calendar and email queries are limited to recent items
3. **Lazy Loading**: User-specific data only fetches when user is selected
4. **Error Handling**: Graceful fallbacks for API failures

## Security

1. **Admin-Only Access**: All endpoints require admin role
2. **Application Permissions**: Uses app-level permissions, not user impersonation
3. **Data Isolation**: No user data is stored; all queries are real-time
4. **HTTPS Only**: All Graph API calls use HTTPS
5. **Token Security**: Secrets stored in environment variables

## Troubleshooting

### "Failed to get M365 token"
- Verify Azure AD credentials in environment variables
- Check that app registration has required permissions
- Ensure tenant ID is correct

### "No users found"
- Verify that users exist in Azure AD
- Check that app has `User.Read.All` permission
- Confirm tenant connectivity

### "Unable to fetch calendar/emails/files"
- Verify user email address is correct
- Check that app has required permissions for each service
- Ensure user has data in the respective service (calendar events, emails, files)

## Future Enhancements

1. **Batch User Analysis**: Analyze multiple users simultaneously
2. **Historical Trends**: Track M365 usage over time
3. **Anomaly Detection**: Identify unusual activity patterns
4. **Recommendations Engine**: Personalized optimization suggestions
5. **Export Reports**: Generate PDF/Excel reports of insights
6. **Scheduled Digests**: Weekly/monthly M365 activity summaries
7. **Integration with Copilot KB**: Auto-generate KB articles from common issues

## References

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/overview)
- [OAuth 2.0 Client Credentials Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)
- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/en-us/graph/permissions-reference)
