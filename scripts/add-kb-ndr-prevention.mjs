// Using native fetch (Node 18+)

const API_BASE = process.env.API_BASE || 'http://localhost:5173';

const articleContent = `# NDR Spam Loop Incident & Prevention Guide

## What Happened

On April 24, 2026, the GigitekAI helpdesk experienced a **spam loop** that generated **706 tickets** in a single day. The root cause was **NDR (Non-Delivery Report) emails from Microsoft Exchange** being processed as customer emails.

### The Loop Cycle

\`\`\`
1. Email poller fetches emails from support@gigitekai.com
2. Finds a confirmation email sent to invalid customer address
3. Customer email bounces (invalid or blocked)
4. Microsoft Exchange sends NDR (Undeliverable) email back to support@gigitekai.com
5. Email poller sees NDR as a NEW customer email
6. Creates a NEW ticket from the NDR
7. Sends confirmation email for the new ticket
8. That confirmation bounces → creates another NDR → loop continues
\`\`\`

### Result

- 706 spam tickets created in 24 hours
- Emails sent to system addresses (MicrosoftExchange329e71ec88ae4615bbc36ab6ce41109e@gigitekai.com)
- Teams notifications flooded
- SMS/text alerts triggered continuously
- Database bloated with garbage data

---

## How It Was Fixed

### 1. **NDR Detection Filter** (Immediate)
Added logic to detect and skip NDR emails:
- Detects Exchange system addresses
- Skips emails with "Undeliverable:" in subject
- Prevents NDRs from creating new tickets

### 2. **Circuit Breaker** (Defensive)
Implemented automatic pause mechanism:
- Tracks consecutive errors
- Pauses poller after 3 errors for 15 minutes
- Prevents cascading failures

### 3. **Rate Limiting** (Protective)
Added ticket creation throttle:
- Max 50 tickets per hour
- Skips emails if rate exceeded
- Resets hourly

### 4. **Data Cleanup**
Deleted all 706 spam tickets from database

---

## Prevention Strategies

### Strategy 1: Email Validation (Recommended)

**What:** Validate customer email addresses before sending confirmation emails

**How:**
- Use email verification API (e.g., ZeroBounce, NeverBounce)
- Check if email is valid before sending confirmation
- Only create ticket if email is valid
- Log invalid emails for review

**Benefits:**
- Prevents bounces entirely
- Reduces false NDRs
- Improves data quality

---

### Strategy 2: NDR Handling (Already Implemented)

**What:** Automatically handle NDR emails

**How:**
- Detect NDR patterns (subject, sender, headers)
- Extract original ticket ID from NDR
- Mark original ticket as "Delivery Failed"
- Alert support team
- Don't create new ticket

**Benefits:**
- Stops the loop immediately
- Provides visibility into delivery issues
- Helps identify bad customer data

---

### Strategy 3: Sender Whitelist (Recommended)

**What:** Only process emails from known customer domains

**How:**
- Maintain list of approved customer domains
- Only create tickets from whitelisted senders
- Log all other emails for manual review
- Add new domains to whitelist after verification

**Benefits:**
- Blocks system emails automatically
- Prevents spoofing
- Increases security

---

### Strategy 4: Email Header Analysis (Advanced)

**What:** Analyze email headers to detect NDRs and system emails

**How:**
- Check \`X-Mailer\` header (Exchange, Gmail, etc.)
- Check \`Return-Path\` header
- Check \`Precedence: bulk\` (automated emails)
- Check \`Auto-Submitted: auto-replied\` (NDRs, out-of-office)

**Benefits:**
- More accurate detection
- Catches edge cases
- Reduces false positives

---

### Strategy 5: Rate Limiting & Throttling (Already Implemented)

**What:** Limit ticket creation rate

**How:**
- Max tickets per hour (currently 50)
- Max tickets per sender (e.g., 5 per sender per day)
- Queue tickets for manual review if rate exceeded
- Alert admin if threshold crossed

**Benefits:**
- Stops runaway loops
- Provides time to investigate
- Protects system resources

---

### Strategy 6: Monitoring & Alerts (Recommended)

**What:** Monitor for spam patterns in real-time

**How:**
- Alert if ticket creation rate spikes
- Alert if multiple tickets from same sender
- Alert if tickets from system addresses
- Daily report of suspicious activity

**Metrics to Monitor:**
- Tickets created per hour (baseline: 5-10, alert at 50+)
- Unique senders per day
- Bounce rate (track NDRs)
- Ticket creation by source

---

### Strategy 7: Bounce Management (Recommended)

**What:** Track and manage email bounces

**How:**
- Implement bounce tracking (hard vs. soft bounces)
- Hard bounce (invalid email) → disable customer
- Soft bounce (temporary) → retry later
- Track bounce rate by customer/domain

**Benefits:**
- Prevents repeated NDRs
- Identifies bad data
- Improves email deliverability

---

## Recommended Implementation Plan

### Phase 1: Immediate (Already Done)
- ✅ NDR detection filter
- ✅ Circuit breaker
- ✅ Rate limiting

### Phase 2: Short-term (1-2 weeks)
- [ ] Email validation API integration
- [ ] Sender whitelist
- [ ] Bounce tracking
- [ ] Real-time monitoring & alerts

### Phase 3: Long-term (1-2 months)
- [ ] Advanced header analysis
- [ ] Machine learning spam detection
- [ ] Customer email verification workflow
- [ ] Comprehensive audit dashboard

---

## Quick Reference: What to Do If This Happens Again

### Immediate Response (First 5 minutes)
1. **Stop the poller:** Kill the email polling process
2. **Check ticket count:** Verify spam is happening
3. **Identify pattern:** Check if NDRs, system emails, or other spam

### Investigation (Next 15 minutes)
1. **Query recent tickets:** Find common sender/subject
2. **Check email logs:** See what's being processed
3. **Review error logs:** Look for patterns

### Remediation (Next 30 minutes)
1. **Delete spam tickets:** Run cleanup script
2. **Clear email queue:** Archive/delete spam emails
3. **Update filters:** Add new detection rules if needed
4. **Restart poller:** Resume normal operation

### Post-Incident (Next 24 hours)
1. **Root cause analysis:** Why did this happen?
2. **Update prevention:** Add new rules/filters
3. **Communicate:** Notify team of changes
4. **Monitor:** Watch for recurrence

---

## Key Learnings

1. **Email validation is critical** — Never assume customer emails are valid
2. **System emails need filtering** — Exchange, Gmail, etc. send automated emails
3. **Loops need circuit breakers** — Always have a kill switch
4. **Monitoring saves time** — Catch issues before they escalate
5. **Documentation matters** — This guide prevents future confusion

---

**Last Updated:** April 24, 2026  
**Incident Status:** Resolved  
**Prevention Status:** Implemented`;

async function addKBArticle() {
  console.log('[KB API] Adding NDR Prevention article to Knowledge Base...');

  try {
    const payload = {
      json: {
        title: 'NDR Spam Loop Incident & Prevention Guide',
        content: articleContent,
        category: 'Incident Management',
        isPublished: true,
      },
    };

    const response = await fetch(`${API_BASE}/api/trpc/kb.createArticle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('[KB API] ✅ Article created successfully!');
    console.log('[KB API] Title: NDR Spam Loop Incident & Prevention Guide');
    console.log('[KB API] Category: Incident Management');
    console.log('[KB API] Status: Published');
    console.log('[KB API] Result:', result);

  } catch (error) {
    console.error('[KB API] ❌ Error:', error.message);
    console.log('[KB API] Note: Make sure the dev server is running at', API_BASE);
    process.exit(1);
  }
}

addKBArticle();
