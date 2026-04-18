# 🎓 GigitekAI Helpdesk System - Agent Training Guide

Welcome to the new helpdesk platform! This guide introduces all features and best practices for support agents.

---

## 📌 Quick Start

1. Navigate to **https://gigitekai.com/admin**
2. Sign in with your GigitekAI email and password
3. View the dashboard with real-time metrics
4. Start managing tickets!

---

## 🎯 Key Features

### ⏱️ Real-Time SLA Tracking

The SLA timer shows two critical deadlines with visual countdown:

- **Response SLA:** Time until you must respond to the customer
- **Resolution SLA:** Time until the ticket must be resolved

**Color Coding:** Green (plenty of time) → Yellow (warning) → Orange (urgent) → Red (critical)

**SLA Times by Priority:**
- 🔴 **Critical:** 30 minutes response / 2 hours resolution
- 🟠 **High:** 1 hour response / 8 hours resolution
- 🟡 **Medium:** 4 hours response / 24 hours resolution
- 🟢 **Low:** 8 hours response / 48 hours resolution

**When SLA is running low, respond immediately to avoid breaches!**

### 👤 Agent Assignment

To assign a ticket:
1. Click "Assign Agent" button in Quick Actions
2. Select an agent from the dropdown (shows current workload)
3. Click "Assign"
4. The agent receives a notification

**Best Practice:** Assign tickets to agents with the lowest current workload to balance team capacity.

### 🎫 Ticket Operations

**Status Workflow:**
- **Open** → New ticket, not yet assigned
- **In Progress** → Agent is actively working on the ticket
- **On Hold** → Waiting for customer response or additional information
- **Resolved** → Issue is fixed, awaiting customer confirmation
- **Closed** → Customer confirmed resolution, ticket is complete

**Merge Tickets:**
- Combine duplicate tickets into one
- Preserves conversation history
- Logs merge in activity history

**Bulk Actions:**
- Select multiple tickets
- Update status, assign, priority, or category in bulk
- Close multiple tickets at once
- Perfect for processing similar tickets quickly

**Canned Responses:**
- Use pre-written templates for quick replies
- Search by keyword or browse by category
- Customize templates for specific customers
- Common templates: greeting, investigation, resolution, follow-up

### 🤖 AI-Powered Features

**Auto-Categorization:**
- System suggests priority and category when ticket is created
- Review and adjust if needed
- Improves over time with team feedback

**Suggested Replies:**
- AI generates response options based on ticket content
- Integrates with knowledge base articles
- Select one and customize for your customer
- Saves time on common questions

**Knowledge Base:**
- Search articles to help customers self-serve
- Create new articles for common issues
- Link KB articles in AI-generated replies
- Reduces support volume over time

### 💬 Microsoft Teams Integration

**Receive Notifications:**
- Ticket events posted to #helpdesk channel
- Includes ticket ID, priority, customer, and SLA countdown
- Click buttons for quick actions

**Reply from Teams:**
- Click "Reply" button on notification
- Type your response in Teams
- Reply automatically added to helpdesk ticket
- Customer receives email notification

**Slash Commands:**
Use these commands in #helpdesk channel:
- `/status [ticket-id] [new-status]` - Change ticket status
- `/priority [ticket-id] [priority]` - Update priority
- `/assign [ticket-id] [@agent]` - Assign ticket to agent

**Example:** `/status 1234 resolved` changes ticket #1234 to resolved status

**Agent Status Sync:**
- Your Teams status (Available/Busy/Away/Offline) syncs with helpdesk
- When you're "Busy" or "Away", new tickets won't be assigned
- Return to "Available" to receive new assignments

---

## 📊 Performance Metrics

Your performance is tracked on the dashboard:

| Metric | Target | Description |
|--------|--------|-------------|
| **SLA Adherence** | >95% | Percentage of tickets meeting SLA targets |
| **Resolution Rate** | >90% | Percentage of tickets you've resolved |
| **Avg Response Time** | <2 hours | How quickly you respond to customers |
| **Tickets Assigned** | - | Total tickets assigned to you |
| **Customer Satisfaction** | >4.5/5 | Average rating from resolved tickets |

---

## 💡 Best Practices

### ✅ Responding Quickly
- Respond to all tickets within SLA response time
- Critical tickets should be acknowledged within 30 minutes
- Use canned responses to respond faster to common questions

### ✅ Keeping Tickets Organized
- Update ticket status as you progress through resolution
- Use "On Hold" status when waiting for customer information
- Close tickets promptly when resolved to keep queue clean

### ✅ Providing Quality Support
- Be professional and empathetic in all responses
- Provide clear, step-by-step instructions
- Offer multiple solutions when possible
- Follow up with customers after closing tickets

### ✅ Collaborating with Team
- Assign tickets to team members with lower workload
- Use merge feature to consolidate duplicate tickets
- Share canned responses and KB articles with team
- Provide feedback on AI-suggested replies

---

## 🆘 Troubleshooting

### I can't log in
- Verify your email and password are correct
- Check that your account is active
- Clear browser cache and try again
- Use an incognito window to rule out browser extensions

### SLA timer is not updating
- Refresh the page (F5 or Cmd+R)
- Check your internet connection
- Try a different browser
- Contact support if issue persists

### AI suggestions are not relevant
- The AI learns from your feedback
- Ignore poor suggestions and provide your own response
- Over time, suggestions will improve
- Report consistently poor suggestions to admin

### Teams notifications not arriving
- Verify #helpdesk channel is configured correctly
- Check that you're a member of the channel
- Verify Teams webhooks are enabled in admin settings
- Check Teams notification settings (Settings → Notifications)

---

## 🆘 Getting Help

If you encounter issues or have questions:

- 📧 **Email:** support@gigitek.com
- 📞 **Phone:** 609-676-4483
- 💬 **Teams:** Post in #helpdesk-support channel
- ❓ **In-App:** Click "Help" in the top navigation

---

## 🎯 Summary

The new helpdesk system is designed to make your job easier:

✅ Real-time SLA tracking ensures timely responses
✅ AI-powered suggestions improve response quality
✅ Teams integration enables seamless collaboration
✅ Bulk operations handle high ticket volumes
✅ Knowledge base reduces support volume

**Welcome to the team! Let's deliver exceptional support together! 🚀**

---

**For the complete training guide, see:** AGENT_TRAINING_GUIDE.md
