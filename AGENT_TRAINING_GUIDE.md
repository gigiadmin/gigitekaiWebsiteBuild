# GigitekAI Helpdesk - Agent Training Guide

## Welcome to the New Helpdesk System

This guide introduces support agents to the enhanced GigitekAI helpdesk platform with real-time SLA tracking, AI-powered features, and Microsoft Teams integration. The new system is designed to improve efficiency, response times, and customer satisfaction.

## Getting Started

### Logging In

1. Navigate to https://gigitekai.com/admin
2. Click "Get In Touch" → "Support" to access the helpdesk portal
3. Sign in with your GigitekAI email and password
4. You'll be directed to the ticket dashboard

### Dashboard Overview

The main dashboard displays:

- **Total Tickets:** Current ticket volume across all statuses
- **Unassigned Tickets:** Tickets waiting for agent assignment
- **SLA Compliance:** Percentage of tickets meeting SLA targets
- **Critical Tickets:** High-priority tickets requiring immediate attention
- **Agent Performance Table:** Your workload, resolution rate, and SLA adherence

## Working with Tickets

### Creating a New Ticket

1. Click "New Ticket" button in the top-right
2. Enter customer information (name, email)
3. Add ticket title and detailed description
4. Select priority (Critical, High, Medium, Low)
5. Choose category (Technical Support, Billing, Feature Request, etc.)
6. Click "Create Ticket"

The system automatically assigns a ticket number (e.g., TICKET #1234) and sends a confirmation email to the customer.

### Viewing Ticket Details

Click any ticket in the list to open the full ticket view, which shows:

- **Ticket Header:** ID, title, priority (color-coded), status
- **Customer Info:** Name, email, company, contact history
- **SLA Timer:** Time remaining until response/resolution deadline
- **Conversation:** All replies and activity in chronological order
- **Quick Actions:** Assign, Merge, Change Status, Add Reply, Close

### SLA Timer Display

The SLA timer shows two critical deadlines:

- **Response SLA:** Time until you must respond to the customer (color-coded: green → yellow → orange → red)
- **Resolution SLA:** Time until the ticket must be resolved

SLA times vary by priority:
- **Critical:** 30 minutes response / 2 hours resolution
- **High:** 1 hour response / 8 hours resolution
- **Medium:** 4 hours response / 24 hours resolution
- **Low:** 8 hours response / 48 hours resolution

When SLA time is running low, the timer turns red and an alert icon appears. Respond immediately to avoid SLA breaches.

### Assigning Tickets

To assign a ticket to yourself or another agent:

1. Click "Assign Agent" button in Quick Actions
2. Select an agent from the dropdown (shows current workload)
3. Click "Assign"
4. The ticket is now assigned and the agent receives a notification

**Best Practice:** Assign tickets to agents with the lowest current workload to balance the team's capacity.

### Changing Ticket Status

Use the status dropdown to move tickets through the workflow:

- **Open:** New ticket, not yet assigned
- **In Progress:** Agent is actively working on the ticket
- **On Hold:** Waiting for customer response or additional information
- **Resolved:** Issue is fixed, awaiting customer confirmation
- **Closed:** Customer confirmed resolution, ticket is complete

Click the status dropdown and select the new status. The system logs this change in the activity history.

### Adding Replies

To respond to the customer:

1. Scroll to the bottom of the conversation
2. Click in the reply text box
3. Type your response
4. (Optional) Click "Suggested Replies" to see AI-powered response suggestions
5. (Optional) Click "Insert Canned Response" to use a pre-written template
6. Click "Send Reply"

The customer receives an email notification with your response and can reply directly via email.

### Using Canned Responses

Canned responses are pre-written templates for common questions. To use them:

1. Click "Insert Canned Response" in the reply box
2. Search by keyword or browse by category
3. Click the response to insert it
4. Edit the template as needed for the specific customer
5. Click "Send Reply"

Common canned responses include:
- "Thank you for contacting support"
- "We're investigating your issue"
- "Please restart your system and try again"
- "Your issue has been resolved"

Agents can create new canned responses by clicking "New Canned Response" in the admin menu.

## Advanced Features

### AI-Powered Suggestions

The system provides AI-powered assistance in two ways:

**1. Auto-Categorization:** When you create a ticket, the system suggests a priority and category based on the ticket content. Review and adjust if needed.

**2. Suggested Replies:** When viewing a ticket, click "Suggested Replies" to see AI-generated response options based on the ticket content and knowledge base. Select one and customize it for your customer.

### Ticket Merge

If you discover a duplicate ticket:

1. Open one of the duplicate tickets
2. Click "Merge" in Quick Actions
3. Enter the ID of the other ticket (e.g., 1234)
4. Click "Merge Tickets"
5. The tickets are combined, and the conversation history is preserved

The system logs the merge in the activity history, and the customer is notified of the consolidated ticket.

### Bulk Operations

To perform actions on multiple tickets at once:

1. Go to the Admin Panel
2. Select multiple tickets using checkboxes
3. Click "Bulk Actions" menu
4. Choose an action:
   - **Update Status:** Change status for all selected tickets
   - **Assign Agent:** Assign all tickets to one agent
   - **Update Priority:** Change priority for all tickets
   - **Update Category:** Change category for all tickets
   - **Close Tickets:** Close all selected tickets with notes
5. Confirm the action

Bulk operations are useful for processing similar tickets quickly.

### Knowledge Base

The knowledge base contains articles that help customers self-serve and provide context for support responses.

**Accessing the Knowledge Base:**
1. Click "Knowledge Base" in the admin menu
2. Search by keyword or browse by category
3. Click an article to read the full content

**Creating a KB Article:**
1. Click "New Article"
2. Enter title and content
3. Select category
4. Click "Save as Draft" to preview, or "Publish" to make it live
5. Published articles are searchable and linked from AI-generated replies

## Microsoft Teams Integration

The helpdesk is integrated with Microsoft Teams, allowing you to manage tickets directly from Teams.

### Receiving Notifications in Teams

When a ticket is created or updated, a notification is posted to the #helpdesk channel in Teams. The notification includes:

- Ticket ID, title, and priority (color-coded)
- Customer name and email
- Current status and SLA countdown
- Quick action buttons

### Replying in Teams

To reply to a ticket from Teams:

1. Click the "Reply" button on the ticket notification
2. Type your response in the Teams message
3. Send the message
4. Your reply is automatically added to the helpdesk ticket
5. The customer receives an email notification

### Checking Agent Status

Your Teams status (Available, Busy, Away, Offline) is automatically synced with the helpdesk. When you're marked as "Busy" or "Away" in Teams, the system won't assign new tickets to you. When you return to "Available," tickets can be assigned again.

### Using Slash Commands in Teams

In the #helpdesk channel, you can use slash commands to manage tickets:

- `/status [ticket-id] [new-status]` - Change ticket status
- `/priority [ticket-id] [priority]` - Update priority
- `/assign [ticket-id] [@agent]` - Assign ticket to agent

Example: `/status 1234 resolved` changes ticket #1234 to resolved status.

## Performance Metrics

Your performance is tracked and displayed in the dashboard:

- **Tickets Assigned:** Total tickets assigned to you
- **Resolution Rate:** Percentage of tickets you've resolved
- **Average Response Time:** How quickly you respond to customers
- **SLA Adherence:** Percentage of tickets meeting SLA targets
- **Customer Satisfaction:** Average rating from resolved tickets

Aim for:
- **SLA Adherence:** >95%
- **Resolution Rate:** >90%
- **Average Response Time:** <2 hours

## Best Practices

### Responding Quickly

- Aim to respond to all tickets within the SLA response time
- Critical tickets should be acknowledged within 30 minutes
- Use canned responses to respond faster to common questions

### Keeping Tickets Organized

- Update ticket status as you progress through resolution
- Use "On Hold" status when waiting for customer information
- Close tickets promptly when resolved to keep the queue clean

### Providing Quality Support

- Be professional and empathetic in all responses
- Provide clear, step-by-step instructions
- Offer multiple solutions when possible
- Follow up with customers after closing tickets

### Collaborating with Team

- Assign tickets to team members with lower workload
- Use the merge feature to consolidate duplicate tickets
- Share canned responses and KB articles with the team
- Provide feedback on suggested AI replies to improve accuracy

## Troubleshooting

### I can't log in

- Verify your email and password are correct
- Check that your account is active (contact admin if unsure)
- Clear browser cache and try again
- Use an incognito window to rule out browser extensions

### SLA timer is not updating

- Refresh the page (F5 or Cmd+R)
- Check your internet connection
- Try a different browser
- Contact support if the issue persists

### AI suggestions are not relevant

- The AI learns from your feedback. If a suggestion is poor, ignore it and provide your own response.
- Over time, suggestions will improve as the system learns your team's patterns.
- Report consistently poor suggestions to the admin team.

### Teams notifications are not arriving

- Verify the #helpdesk channel is configured correctly
- Check that you're a member of the channel
- Verify Teams webhooks are enabled in admin settings
- Check Teams notification settings (Settings → Notifications)

## Getting Help

If you encounter issues or have questions:

- **Email:** support@gigitek.com
- **Phone:** 727-382-6909
- **Teams:** Post in #helpdesk-support channel
- **In-App:** Click "Help" in the top navigation

## Summary

The new helpdesk system is designed to make your job easier by providing:

- Real-time SLA tracking to ensure timely responses
- AI-powered suggestions to improve response quality
- Teams integration for seamless collaboration
- Bulk operations to handle high ticket volumes
- Knowledge base for customer self-service

Welcome to the team! We're excited to see how these new features improve our support quality and customer satisfaction.

**Questions?** Reach out to the support team at support@gigitek.com or call 727-382-6909.
