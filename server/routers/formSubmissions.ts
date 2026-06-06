import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { formSubmissions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmailViaGraph } from "../_core/emailService";
import { sendToTeamsWithRetry, resolveWebhookUrl } from "../_core/teamsWebhookUtils";

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

      // Send notification to owner
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

**Action:** Contact within 24 hours to discuss web discovery needs.
          `.trim(),
        });
      } catch (err) {
        console.warn("Failed to send owner notification:", err);
      }

      // Send confirmation email to requester
      try {
        await sendEmailViaGraph({
          to: [{ emailAddress: { address: input.email } }],
          subject: "We Received Your Web Discovery Intake Form",
          bodyContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00D4FF 0%, #0066FF 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .footer { color: #666; font-size: 12px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You, ${input.name}!</h1>
      <p>We've received your Web Discovery Intake Form</p>
    </div>
    
    <div class="content">
      <p>Hi ${input.name},</p>
      
      <p>Thank you for submitting your IT Discovery intake form. We're excited to learn about your business and IT needs!</p>
      
      <h3>What Happens Next</h3>
      <ul>
        <li>Our team will review your responses within 24 hours</li>
        <li>We'll contact you at <strong>${input.phone}</strong> or <strong>${input.email}</strong></li>
        <li>We'll discuss your transformation goals and create a personalized plan</li>
      </ul>
      
      <h3>Your Submission Details</h3>
      <p><strong>Company:</strong> ${input.company || "Not provided"}</p>
      <p><strong>Category:</strong> ${input.category}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="footer">
      <p>Questions? Contact us at support@gigitekai.com or call (609) 676-4483</p>
      <p>&copy; 2026 GigitekAI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
            `.trim(),
        });
        console.log("Confirmation email sent to:", input.email);
      } catch (err) {
        console.warn("Failed to send confirmation email to requester:", err);
      }

      // Send Teams notification
      try {
        const webhookUrl = resolveWebhookUrl(input.category);
        const payload = {
          type: "message",
          attachments: [
            {
              contentType: "application/vnd.microsoft.card.adaptive",
              contentUrl: null,
              content: {
                $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                type: "AdaptiveCard",
                version: "1.4",
                body: [
                  {
                    type: "Container",
                    style: "emphasis",
                    items: [
                      {
                        type: "TextBlock",
                        text: "🎯 New Web Discovery Intake",
                        weight: "bolder",
                        size: "large",
                        color: "accent",
                      },
                    ],
                  },
                  {
                    type: "Container",
                    items: [
                      {
                        type: "FactSet",
                        facts: [
                          { name: "Name", value: input.name },
                          { name: "Email", value: input.email },
                          { name: "Phone", value: input.phone },
                          { name: "Company", value: input.company || "N/A" },
                          { name: "Category", value: input.category },
                        ],
                      },
                      {
                        type: "TextBlock",
                        text: "Message:",
                        weight: "bolder",
                        spacing: "medium",
                      },
                      {
                        type: "TextBlock",
                        text: input.message.substring(0, 300),
                        wrap: true,
                        spacing: "small",
                      },
                    ],
                  },
                ],
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "View in Admin",
                    url: "https://gigitekai.com/admin/form-submissions",
                  },
                ],
              },
            },
          ],
        };

        await sendToTeamsWithRetry(
          webhookUrl,
          payload,
          `Web Discovery Intake from ${input.name}`
        );
      } catch (err) {
        console.warn("Failed to send Teams notification:", err);
      }

      // Send notification email to support
      try {
        await sendEmailViaGraph({
          to: [{ emailAddress: { address: process.env.SUPPORT_EMAIL || "support@gigitekai.com" } }],
          subject: `🎯 New Web Discovery Intake: ${input.name} from ${input.company || "Unknown Company"}`,
          bodyContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00D4FF 0%, #0066FF 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .details { background: #f0f8ff; padding: 15px; border-left: 4px solid #00D4FF; margin-bottom: 15px; }
    .message-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
    .footer { color: #666; font-size: 12px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Web Discovery Intake Submission</h1>
      <p>Action Required: Contact within 24 hours</p>
    </div>
    
    <div class="details">
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
      <p><strong>Phone:</strong> <a href="tel:${input.phone}">${input.phone}</a></p>
      <p><strong>Company:</strong> ${input.company || "Not provided"}</p>
      <p><strong>Category:</strong> ${input.category}</p>
      <p><strong>Source:</strong> ${input.source}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="message-box">
      <h3>Submission Message:</h3>
      <p>${input.message.replace(/\n/g, "<br>")}</p>
    </div>
    
    <div class="footer">
      <p>This is an automated notification. Please respond to the requester within 24 hours.</p>
    </div>
  </div>
</body>
</html>
            `.trim(),
        });
        console.log("Support notification email sent to:", process.env.SUPPORT_EMAIL || "support@gigitekai.com");
      } catch (err) {
        console.warn("Failed to send support notification email:", err);
      }

      return {
        success: true,
        message: "Form submitted successfully. We'll be in touch soon!",
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

      // Build query
      let query: any = db.select().from(formSubmissions);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Get total count
      let countQuery: any = db
        .select({ count: count() })
        .from(formSubmissions);
      
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      
      const countResult = await countQuery;
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
        .set({ status: "contacted", contactedAt: new Date().toISOString() })
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
        .set({ status: "converted" })
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
        .set({ status: "spam" })
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
