# GigitekAI Website — Production Readiness SOP

**Document ID:** GG-SOP-001  
**Version:** 1.0  
**Owner:** Harry Henry-Santiago, CEO & Founder, GigitekAI  
**Last Updated:** April 23, 2026  
**Classification:** Internal — Operations

---

## Purpose

This Standard Operating Procedure (SOP) defines the steps required to prepare the GigitekAI website and admin portal for production deployment. It is designed to be executed before any major go-live event, after a development sprint, or when transitioning from a test/staging environment to the live production site at **gigitekai.com**.

Following this checklist ensures the site presents professionally to clients, prospects, and search engines — with no test data, placeholder content, or debug artifacts visible.

---

## Scope

This SOP applies to:

- The GigitekAI website (gigitekai.com)
- The admin portal (/admin)
- The helpdesk system (/helpdesk)
- The support mailbox (support@gigitekai.com)
- The Manus project environment (GG Website Build Out)

---

## Pre-Conditions

Before executing this checklist, confirm the following are true:

- All development work for the current sprint is complete and committed
- A checkpoint has been saved in the Manus Management UI
- The dev preview URL is loading correctly
- No TypeScript or build errors are present

---

## Production Readiness Checklist

### Step 1 — Database Cleanup

Clear all test, demo, and development data from the live database. This must be done before publishing so clients do not see internal test records.

| Action | Command / Location | Expected Result |
|---|---|---|
| Clear portal emails | Run `node scripts/cleanup-test-data.mjs` | `emailMessages` table = 0 records |
| Clear agent metrics | Included in above script | `agentMetrics` table = 0 records |
| Verify ticket data | Check `/admin/helpdesk` | Only real client tickets remain |
| Verify blog posts | Check `/admin/blog` | Only published, reviewed articles visible |
| Verify KB articles | Check `/admin/kb` | Only approved articles published |

**To run the cleanup script:**

```bash
cd /home/ubuntu/gigitekai
node scripts/cleanup-test-data.mjs
```

The script will print a before/after count confirming all records were removed.

> **Note:** The cleanup script only removes `emailMessages` and `agentMetrics`. It does **not** delete tickets, blog posts, KB articles, or user accounts. Those must be reviewed manually.

---

### Step 2 — Content Review

Review all public-facing content for accuracy, professionalism, and brand consistency.

| Page | What to Check |
|---|---|
| **Homepage** | Hero headline, phone number (727) 382-5776, email support@gigitekai.com |
| **About Us** | Founder bio, team info, company history |
| **Services** | All 7 service descriptions accurate and current |
| **Helpdesk Pricing** | Tier names, prices ($69/$119/$189), feature lists |
| **Blog** | No draft or test articles published; all articles have images |
| **Knowledge Base** | No internal/draft articles visible to public |
| **Contact** | Phone, email, and form submission working |
| **Footer** | Copyright year current, all links functional |

---

### Step 3 — Technical Verification

Confirm all technical systems are functioning correctly before publishing.

| Check | How to Verify | Pass Criteria |
|---|---|---|
| All routes load | Visit /, /blog, /about, /services, /helpdesk-pricing, /contact, /kb, /roi-calculator | No white pages, no 404s |
| Admin portal | Visit /admin | Loads with correct dashboard data |
| Email sync | Visit /admin/email, wait 30 seconds | Emails from support@gigitekai.com appear |
| Contact form | Submit a test form | Confirmation message shown, email received |
| AI chat widget | Click chat bubble on homepage | Chat opens, responds to messages |
| Helpdesk ticket | Create a test ticket | Ticket appears in /admin/helpdesk |
| Mobile layout | Test on iPhone/Android | No overflow, nav works, chat widget visible |
| SSL certificate | Check browser padlock | Valid, no warnings |

---

### Step 4 — SEO & Analytics

Confirm SEO elements and tracking are active.

| Item | Location | Status to Confirm |
|---|---|---|
| Sitemap | gigitekai.com/sitemap.xml | All public pages listed |
| Blog sitemap | gigitekai.com/api/sitemap-blog.xml | All published articles listed |
| Robots.txt | gigitekai.com/robots.txt | /admin and /helpdesk blocked |
| Google Search Console | search.google.com/search-console | Sitemap submitted, no crawl errors |
| Analytics | Plausible / Umami dashboard | Tracking active, pageviews recording |
| Meta titles | View source on homepage | `<title>` tag present and correct |
| Structured data | Google Rich Results Test | No errors on homepage |

---

### Step 5 — Admin Portal Readiness

Ensure the admin portal is configured for live operations.

| Item | Action |
|---|---|
| Team accounts | Verify correct team members have admin access at /admin/accounts |
| Email sync | Confirm support@gigitekai.com is connected via MS Graph |
| Teams notifications | Confirm Teams webhook is active (check /admin/preferences) |
| SLA settings | Review SLA thresholds — default: Low 72h, Medium 24h, High 4h, Critical 1h |
| Canned responses | Ensure at least 5 canned responses are configured |
| KB articles | At least 10 published articles for common issues |

---

### Step 6 — Publish

Once all steps above are complete:

1. Open the **Manus Management UI**
2. Click **Save Checkpoint** (if not already done)
3. Click the **Publish** button in the top-right
4. Wait for deployment confirmation (typically 2–5 minutes)
5. Visit **gigitekai.com** in an incognito/private browser window to confirm the live site

---

## Post-Launch Verification (First 30 Minutes)

After publishing, perform these checks on the live production URL:

- [ ] Homepage loads with hero image and all sections
- [ ] Navigation links work (Services, About, Blog, Contact)
- [ ] Chat widget appears and responds
- [ ] Contact form submits successfully
- [ ] /admin loads for authenticated admins
- [ ] /helpdesk loads for authenticated users
- [ ] No JavaScript errors in browser console
- [ ] Google PageSpeed Insights score ≥ 70 (mobile)

---

## Rollback Procedure

If the production site has issues after publishing:

1. Open **Manus Management UI → Version History**
2. Identify the last known-good checkpoint
3. Click **Rollback** on that version
4. Confirm rollback in the dialog
5. Wait 2–5 minutes for deployment
6. Verify the site is restored

Alternatively, contact the development team and provide the checkpoint version ID.

---

## Monthly Maintenance Schedule

| Task | Frequency | Owner |
|---|---|---|
| Clear test emails from portal | Before each go-live | Admin |
| Review and publish new blog articles | Monthly | Harry / Content Team |
| Update KB articles | Monthly | Support Team |
| Review helpdesk SLA performance | Monthly | Harry |
| Check Google Search Console for errors | Monthly | Admin |
| Update sitemap if new pages added | As needed | Developer |
| Review team member access | Quarterly | Harry |
| Renew SSL certificate | Annually (auto-renew) | Platform |

---

## Quick Reference — Key URLs

| Resource | URL |
|---|---|
| Production site | https://gigitekai.com |
| Admin portal | https://gigitekai.com/admin |
| Helpdesk | https://gigitekai.com/helpdesk |
| Sitemap | https://gigitekai.com/sitemap.xml |
| Blog sitemap | https://gigitekai.com/api/sitemap-blog.xml |
| Robots.txt | https://gigitekai.com/robots.txt |
| Dev preview | https://3000-iex2xab39ych7p66cfy0r-81ef4544.us2.manus.computer |

---

## Quick Reference — Key Contacts

| Role | Name | Contact |
|---|---|---|
| CEO & Owner | Harry Henry-Santiago | harry@gigitekai.com |
| Support Mailbox | — | support@gigitekai.com |
| Phone | — | (727) 382-5776 |

---

## Cleanup Script Reference

The cleanup script at `scripts/cleanup-test-data.mjs` performs the following actions:

1. Connects to the production MySQL database using `DATABASE_URL` from `.env`
2. Counts records in `emailMessages` and `agentMetrics` tables
3. Deletes all records from both tables
4. Prints a verification count confirming deletion
5. Closes the database connection

**What it clears:**
- All synced emails from the support mailbox portal view
- All AI agent performance metrics

**What it does NOT clear:**
- Helpdesk tickets
- Blog posts or KB articles
- User accounts or team members
- Contact form submissions
- Chat history
- Notification logs

To extend the script to clear additional tables, edit `scripts/cleanup-test-data.mjs` and add additional `DELETE FROM` statements following the same pattern.

---

*Document maintained by the GigitekAI development team. Update this SOP whenever new data tables or admin features are added to the portal.*
