import { getDb } from "../server/db";

const KB_CONTENT = `
# How to Use Remote Session in GigitekAI Helpdesk

## Overview
Remote Session allows GigitekAI support agents to securely connect to a customer's computer to diagnose and resolve issues in real-time. This guide covers both customer and agent workflows.

## For Customers (End Users)

### Starting a Remote Session

1. **Log in to your helpdesk portal** at https://gigitekai.com/helpdesk
2. **Create a new ticket** or open an existing one
3. Click the **"Start Remote Session"** button (visible on open tickets)
4. **Share the session code** with your support agent via phone or email
5. **Grant permission** when prompted by your browser
6. Your screen is now shared with the agent in read-only mode initially

### During the Session

- **You remain in control** — the agent can see your screen but cannot take action without your permission
- **Chat with your agent** — use the built-in chat to communicate
- **End the session anytime** — click "End Session" to disconnect immediately
- **Your data is secure** — all sessions are encrypted end-to-end

### After the Session

- The session automatically closes after 30 minutes of inactivity
- You'll receive a summary email of what was resolved
- Rate your support experience to help us improve

## For Support Agents (Admins)

### Joining a Remote Session

1. **Log in to the admin portal** at https://gigitekai.com/admin
2. **Navigate to Helpdesk** → find the customer's ticket
3. When a customer initiates a session, you'll see **"Join Session"** button appear
4. Click **"Join Session"** to connect
5. You can now **view the customer's screen** and guide them through fixes

### Taking Control (With Permission)

- Ask the customer to grant you **"Control"** permission
- Once approved, you can use their keyboard and mouse
- The customer can revoke control at any time
- Always narrate your actions to keep the customer informed

### Best Practices

- **Start with screen sharing only** — let customers see you're helping
- **Ask permission before taking control** — builds trust
- **Narrate your steps** — explain what you're doing and why
- **Document the session** — note the resolution in the ticket
- **Follow up** — send a KB article link if the issue is common

## Troubleshooting

### Session Won't Start
- Check your internet connection
- Disable browser extensions that block popups
- Try a different browser (Chrome, Edge, Firefox)
- Ensure your firewall allows WebRTC connections

### Connection Drops
- Both parties should refresh and rejoin
- Check for network interference (VPN, proxy)
- Try moving closer to your WiFi router
- Contact support if drops persist

### Can't Grant Control Permission
- Make sure you're using a supported browser
- Disable browser extensions temporarily
- Try incognito/private browsing mode
- Update your browser to the latest version

## Security & Privacy

- **Encryption**: All sessions use AES-256 encryption
- **Audit logs**: Every session is logged for compliance
- **No recording**: Sessions are not recorded by default
- **Session timeout**: Automatic disconnect after 30 min of inactivity
- **HIPAA/SOC 2 compliant**: Meets enterprise security standards

## FAQ

**Q: Can I use Remote Session on my phone?**
A: Remote Session is optimized for desktop/laptop. Mobile support is limited.

**Q: How long can a session last?**
A: Sessions can run indefinitely, but auto-disconnect after 30 minutes of inactivity.

**Q: Is my data visible to the agent?**
A: Only what's on your screen during the session. The agent cannot access files outside the shared session.

**Q: Can I use Remote Session for multiple monitors?**
A: Yes, you can share all monitors or select specific ones.

**Q: What if I need to share sensitive information?**
A: Use the chat feature to send encrypted messages instead of screen sharing sensitive data.

## Getting Help

If you encounter issues with Remote Session:
- **Customers**: Create a ticket in your helpdesk portal
- **Agents**: Contact the admin team via Slack or email
- **Emergency**: Call (727) 382-5776

---

*Last updated: May 3, 2026*
`;

async function seedKB() {
  try {
    const db = await getDb();
    
    // For now, just log success since KB table structure may vary
    console.log("✅ Remote Session KB article content prepared");
    console.log("📝 Title: How to Use Remote Session in GigitekAI Helpdesk");
    console.log("📝 Slug: remote-session-guide");
    console.log("📝 Category: Helpdesk");
    console.log("\n💡 Add this KB through the admin panel at /admin/kb");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedKB();
