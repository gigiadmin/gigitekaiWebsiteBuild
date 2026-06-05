import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { formSubmissions, tickets } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const formSubmissionsRouter = router({
  // Public: Submit a form
  submitForm: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().min(2, "Name required"),
        phone: z.string().min(10, "Phone number required"),
        company: z.string().optional(),
        category: z.string().min(1, "Category required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
        source: z.string().default("website"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new Error("Invalid email format");
      }

      // Check for spam (too many submissions from same email in 1 hour)
      const oneHourAgo = new Date(Date.now() - 3_600_000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const recentSubmissions = await db
        .select({ count: count() })
        .from(formSubmissions)
        .where(
          and(
            eq(formSubmissions.email, input.email),
            gte(formSubmissions.submittedAt, oneHourAgo)
          )
        );

      if ((recentSubmissions[0]?.count ?? 0) > 3) {
        throw new Error("Too many submissions from this email. Please try again later.");
      }

      // Insert form submission
      const formResult = await db.insert(formSubmissions).values({
        email: input.email,
        name: input.name,
        phone: input.phone,
        company: input.company ?? null,
        category: input.category,
        message: input.message,
        source: input.source,
        status: "new",
      });

      const submissionId = formResult.insertId;

      // Create a ticket in the admin system
      try {
        const ticketTitle = `Web Discovery: ${input.name} - ${input.category}`;
        const ticketDescription = `
**Web Discovery Intake Submission**

**Submitter Information:**
- Name: ${input.name}
- Email: ${input.email}
- Phone: ${input.phone}
- Company: ${input.company ?? "Not provided"}
- Category: ${input.category}
- Source: ${input.source}

**Message:**
${input.message}

**Form Submission ID:** ${submissionId}

**Action Required:** Contact the submitter within 24 hours to discuss their web discovery needs.
        `.trim();

        await db.insert(tickets).values({
          title: ticketTitle,
          description: ticketDescription,
          status: "open",
          priority: "medium",
          category: "web-discovery",
          submitterEmail: input.email,
          submitterName: input.name,
          submitterPhone: input.phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Failed to create ticket:", err);
      }

      // Send confirmation email to submitter
      try {
        const confirmationEmail = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0A0E1A; color: #00D4FF; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #999; }
    ul { list-style: none; padding: 0; }
    li { padding: 8px 0; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Thank You for Your Submission!</h2>
    </div>
    <div class="content">
      <p>Hi ${input.name},</p>
      <p>We've received your web discovery intake form and will review your information shortly.</p>
      
      <h3>Your Submission Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${input.name}</li>
        <li><strong>Phone:</strong> ${input.phone}</li>
        <li><strong>Company:</strong> ${input.company ?? "Not provided"}</li>
        <li><strong>Discovery Type:</strong> ${input.category}</li>
      </ul>
      
      <p>Our team will contact you within 24 hours to discuss your project in detail and answer any questions you may have.</p>
      
      <p>If you have any urgent questions in the meantime, feel free to reach out to us at support@gigitekai.com or call (727) 382-6909.</p>
      
      <p>Best regards,<br/><strong>GigitekAI Team</strong></p>
    </div>
    <div class="footer">
      <p>GigitekAI | Intelligent Cloud & AI Solutions</p>
      <p>© 2026 GigitekAI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `.trim();

        // Note: Email sending would be implemented via SendGrid or similar service
        // For now, we'll log it and notify owner
        console.log(`[Email] Confirmation email queued for ${input.email}`);
      } catch (err) {
        console.warn("Failed to queue confirmation email:", err);
      }

      // Send notification to support mailbox via owner notification
      try {
        await notifyOwner({
          title: `🎯 New Web Discovery Intake: ${input.name}`,
          content: `
**Submitter:** ${input.name}
**Email:** ${input.email}
**Phone:** ${input.phone}
**Company:** ${input.company ?? "N/A"}
**Category:** ${input.category}

**Message:**
${input.message}

**Action:** Contact within 24 hours. Ticket created in admin system.
          `.trim(),
        });
      } catch (err) {
        console.warn("Failed to send owner notification:", err);
      }

      return {
        success: true,
        message: "Form submitted successfully. We'll be in touch soon!",
        submissionId,
      };
    }),

  // Admin: Get all submissions
  getSubmissions: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["new", "contacted", "converted", "spam"]).optional(),
        category: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db.select().from(formSubmissions);

      // Apply filters
      const conditions = [];
      if (input.status) {
        conditions.push(eq(formSubmissions.status, input.status));
      }
      if (input.category) {
        conditions.push(eq(formSubmissions.category, input.category));
      }
      if (input.startDate) {
        conditions.push(gte(formSubmissions.submittedAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(formSubmissions.submittedAt, input.endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Get total count
      const countResult = await db
        .select({ count: count() })
        .from(formSubmissions)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = countResult[0]?.count ?? 0;

      // Get paginated results
      const submissions = await query
        .orderBy(desc(formSubmissions.submittedAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        submissions,
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  // Admin: Mark as contacted
  markAsContacted: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(formSubmissions)
        .set({ status: "contacted", updatedAt: new Date().toISOString() })
        .where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Mark as converted
  markAsConverted: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(formSubmissions)
        .set({ status: "converted", updatedAt: new Date().toISOString() })
        .where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Mark as spam
  markAsSpam: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(formSubmissions)
        .set({ status: "spam", updatedAt: new Date().toISOString() })
        .where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Delete submission
  deleteSubmission: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(formSubmissions).where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Get stats
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const totalResult = await db
      .select({ count: count() })
      .from(formSubmissions);

    const newResult = await db
      .select({ count: count() })
      .from(formSubmissions)
      .where(eq(formSubmissions.status, "new"));

    const contactedResult = await db
      .select({ count: count() })
      .from(formSubmissions)
      .where(eq(formSubmissions.status, "contacted"));

    const convertedResult = await db
      .select({ count: count() })
      .from(formSubmissions)
      .where(eq(formSubmissions.status, "converted"));

    return {
      total: totalResult[0]?.count ?? 0,
      new: newResult[0]?.count ?? 0,
      contacted: contactedResult[0]?.count ?? 0,
      converted: convertedResult[0]?.count ?? 0,
    };
  }),
});
