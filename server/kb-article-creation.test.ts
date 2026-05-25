import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { kbArticles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("KB Article Creation - Ticket Creation Guide", () => {
  let articleId: number | null = null;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const articleContent = `# Creating Support Tickets — Complete Guide

**Last Updated:** April 22, 2026 | **Author:** GigitekAI Support Team

---

## Overview

A support ticket is your direct line to the GigitekAI support team. Whether you're reporting an issue, requesting a feature, or asking a billing question, tickets ensure your request is tracked, prioritized, and resolved efficiently. This guide covers how to create tickets as both an end user and an administrator.

---

## For End Users: Creating Your First Ticket

### Step 1: Access the Support Portal

Navigate to the **Support** section of your GigitekAI account. You'll see the ticket creation interface with a prominent **"Create Ticket"** button.

### Step 2: Fill in the Ticket Details

Complete the following fields to create your ticket:

| Field | Description | Required? |
|-------|-------------|-----------|
| **Subject / Title** | A brief, clear description of your issue or request (minimum 5 characters) | Yes |
| **Description** | Detailed explanation of what you're experiencing, what you've tried, and any error messages (minimum 10 characters) | Yes |
| **Priority** | Choose from **Low**, **Medium**, **High**, or **Critical** based on the urgency and impact | Yes |
| **Category** | Select the most relevant category: **General Support**, **Bug Report**, **Feature Request**, or **Billing** | Yes |

### Step 3: Submit Your Ticket

Click the **"Create Ticket"** button. Your ticket will be immediately assigned a unique ticket number (e.g., **#1234**) and placed in the **Open** queue for our support team to review.

### Step 4: Track Your Ticket

You can monitor your ticket's status at any time by visiting the Support portal. Ticket statuses include:

- **Open** — Your ticket has been received and is waiting for initial review
- **In Progress** — A support agent is actively working on your issue
- **On Hold** — We're waiting for additional information from you or a third party
- **Resolved** — Your issue has been fixed; we're awaiting your confirmation
- **Closed** — Your ticket has been completed

You'll receive email notifications whenever your ticket status changes or when a support agent replies.

---

## For Administrators: Creating Tickets on Behalf of Customers

Administrators can create support tickets directly from the **Support Administration** dashboard. This is useful for logging issues reported via phone, email, or in-person conversations.

### Step 1: Open the Support Administration Dashboard

Log in to your admin account and navigate to **Admin > Helpdesk > Support Administration**. You'll see the ticket metrics dashboard.

### Step 2: Click the "Create Ticket" Button

In the top-right corner of the Support Administration header, click the cyan **"+ Create Ticket"** button. A modal dialog will appear.

### Step 3: Enter Customer Information (Optional)

If you're creating a ticket on behalf of an existing customer, fill in:

- **Customer Email** — The email address of the customer (if they exist in the system, the ticket will be linked to their account)
- **Customer Name** — The customer's full name for reference

If the email doesn't match an existing user, the ticket will be created as an **external/walk-in ticket** (userId = 0) and can still be tracked and resolved.

### Step 4: Fill in Ticket Details

Complete the required fields:

- **Subject / Title** — Brief description of the issue (minimum 5 characters)
- **Description** — Detailed explanation of the problem or request (minimum 10 characters)
- **Priority** — **Low**, **Medium**, **High**, or **Critical**
- **Category** — **General Support**, **Bug Report**, **Feature Request**, or **Billing**

### Step 5: Submit the Ticket

Click the **"Create Ticket"** button. The system will:

1. Create the ticket and assign it a unique ticket number
2. Log the action in the ticket's activity history (showing it was created by an admin)
3. Send a notification to the ticket owner (you, the admin)
4. Post a notification to the GigitekAI Teams channel for visibility
5. Create an internal admin notification for tracking

The ticket will immediately appear in the **Tickets** tab of the Support Administration dashboard, where you can assign it to an agent, update its status, add notes, or take other administrative actions.

---

## Best Practices for Ticket Creation

### For End Users

- **Be specific:** Include relevant details, error messages, and steps you've already tried. This helps our team resolve your issue faster.
- **Use the right category:** Selecting the correct category ensures your ticket reaches the right specialist.
- **Set realistic priority:** Reserve **Critical** for issues that block your operations. **High** for significant problems, **Medium** for standard requests, and **Low** for general inquiries.
- **Attach context:** If applicable, include screenshots, log excerpts, or configuration details that help diagnose the problem.

### For Administrators

- **Verify customer information:** Always confirm the customer's email address before creating a ticket to ensure it's linked to the correct account.
- **Document the source:** If a ticket originates from a phone call or in-person conversation, include that context in the description.
- **Assign appropriately:** After creating a ticket, consider assigning it to the most qualified agent based on the category and priority.
- **Use internal notes:** Add private notes visible only to staff (not the customer) to track internal discussions or follow-ups.

---

## Ticket Lifecycle

All tickets follow this standard workflow:

1. **Creation** — Ticket is created and enters the **Open** queue
2. **Assignment** — An admin or system assigns the ticket to an available agent
3. **Investigation** — The agent reviews the ticket and begins troubleshooting
4. **Communication** — The agent may request additional information or provide updates (ticket moves to **In Progress** or **On Hold**)
5. **Resolution** — The agent implements a fix or solution (ticket moves to **Resolved**)
6. **Closure** — The customer confirms the resolution, and the ticket is **Closed**
7. **Archival** — Closed tickets are retained for historical reference and reporting

---

## Common Questions

**Q: How long does it take to get a response?**  
A: Response times depend on ticket priority. **Critical** tickets receive attention within 1 hour; **High** within 4 hours; **Medium** within 1 business day; **Low** within 3 business days.

**Q: Can I update my ticket after creation?**  
A: Yes. End users can reply to their ticket to add information or provide updates. Administrators can edit ticket details, add internal notes, change priority, reassign agents, or update status at any time.

**Q: What if I need to escalate my ticket?**  
A: Contact our support team directly at **support@gigitekai.com** or call **(727) 382-6909**. Mention your ticket number, and we'll prioritize your escalation.

**Q: Are my tickets private?**  
A: Yes. Only you (the ticket creator), assigned support agents, and administrators can view your ticket. All communications are confidential.

**Q: Can I close my own ticket?**  
A: End users cannot directly close tickets. Once resolved, an administrator or agent will close the ticket. You'll receive a notification before closure.

---

## Need Help?

If you encounter any issues creating or managing tickets, reach out to our support team:

- **Email:** support@gigitekai.com
- **Phone:** (727) 382-6909
- **Support Portal:** https://gigitekai.com/support

---

**GigitekAI Support Team**  
*Empowering enterprise technology through intelligent solutions.*`;

    // Check if article already exists
    const existing = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.title, "Creating Support Tickets — Complete Guide"))
      .limit(1);

    if (existing.length > 0) {
      articleId = existing[0].id;
      console.log("✅ KB Article already exists with ID:", articleId);
      return;
    }

    // Create the article
    const result = await db.insert(kbArticles).values({
      title: "Creating Support Tickets — Complete Guide",
      content: articleContent,
      category: "Support & Ticketing",
      tags: "tickets, support, helpdesk, admin, users, how-to, ticket-creation",
      isPublished: true,
      createdBy: 1,
    });

    articleId = (result[0] as any).insertId;
    console.log("✅ KB Article created with ID:", articleId);
  });

  it("should create the ticket creation KB article", async () => {
    expect(articleId).toBeDefined();
    expect(articleId).toBeGreaterThan(0);
  });

  it("should have the article published and searchable", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const article = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.id, articleId!))
      .limit(1);

    expect(article).toHaveLength(1);
    expect(article[0].isPublished).toBe(true);
    expect(article[0].title).toContain("Creating Support Tickets");
  });

  it("should contain all required sections", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const article = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.id, articleId!))
      .limit(1);

    expect(article[0].content).toContain("For End Users");
    expect(article[0].content).toContain("For Administrators");
    expect(article[0].content).toContain("Best Practices");
    expect(article[0].content).toContain("Common Questions");
  });
});
