import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { formSubmissions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmailViaGraph } from "../_core/emailService";
import { sendToTeamsWithRetry, resolveWebhookUrl } from "../_core/teamsWebhookUtils";

const submitFormInput = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Phone number required"),
  company: z.string().optional(),
  category: z.string().min(1, "Category required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  source: z.string().default("website"),
});

export const formSubmissionsRouter = router({
  // Public: Submit a form
  submitForm: publicProcedure
    .input(submitFormInput)
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
      const result = await db.insert(formSubmissions).values({
        email: input.email,
        name: input.name,
        phone: input.phone,
        company: input.company || null,
        category: input.category,
        message: input.message,
        source: input.source,
        status: "new",
      });

      const submissionId = (result as any).insertId || 1;

      // Send confirmation email to requester
      try {
        await sendEmailViaGraph({
          to: [{ emailAddress: { address: input.email } }],
          subject: "We Received Your IT Discovery Request",
          bodyContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #00D4FF;">Thank You for Your Submission</h2>
              <p>Hi ${input.name},</p>
              <p>We've received your IT Discovery intake form and appreciate you taking the time to share details about your business needs.</p>
              <h3>What's Next?</h3>
              <p>Our team will review your submission and reach out within 24 business hours to discuss your specific requirements and how GigitekAI can help transform your IT infrastructure.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Submission Details:</strong></p>
                <p>Company: ${input.company || "Not provided"}</p>
                <p>Category: ${input.category}</p>
                <p>Reference ID: ${submissionId}</p>
              </div>
              <p>If you have any immediate questions, feel free to contact us at <strong>support@gigitekai.com</strong> or call <strong>+1 727-382-6909</strong>.</p>
              <p>Best regards,<br/>The GigitekAI Team</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[Form Submission] Failed to send confirmation email:", emailErr);
      }

      // Send notification email to support
      try {
        await sendEmailViaGraph({
          to: [{ emailAddress: { address: "support@gigitekai.com" } }],
          subject: `New IT Discovery Form: ${input.name} from ${input.company || "Unknown"}`,
          bodyContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #00D4FF;">New Form Submission - IT Discovery</h2>
              <h3>Contact Information:</h3>
              <ul>
                <li><strong>Name:</strong> ${input.name}</li>
                <li><strong>Email:</strong> ${input.email}</li>
                <li><strong>Phone:</strong> ${input.phone}</li>
                <li><strong>Company:</strong> ${input.company || "Not provided"}</li>
              </ul>
              <h3>Submission Details:</h3>
              <ul>
                <li><strong>Category:</strong> ${input.category}</li>
                <li><strong>Source:</strong> ${input.source}</li>
                <li><strong>Submission ID:</strong> ${submissionId}</li>
              </ul>
              <h3>Message:</h3>
              <p style="white-space: pre-wrap; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${input.message}</p>
              <p><a href="https://gigitekai.com/admin/form-submissions" style="background-color: #00D4FF; color: #0A0E1A; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Admin Panel</a></p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[Form Submission] Failed to send support notification:", emailErr);
      }

      // Send to Teams webhook
      try {
        const webhookUrl = resolveWebhookUrl("POWER_AUTOMATE_WEBHOOK_URL");
        if (webhookUrl) {
          await sendToTeamsWithRetry(webhookUrl, {
            title: `New IT Discovery Form: ${input.name}`,
            text: `Company: ${input.company || "Unknown"}\nCategory: ${input.category}\nEmail: ${input.email}\nPhone: ${input.phone}`,
            themeColor: "00D4FF",
            sections: [
              {
                activityTitle: "IT Discovery Form Submission",
                facts: [
                  { name: "Name", value: input.name },
                  { name: "Email", value: input.email },
                  { name: "Phone", value: input.phone },
                  { name: "Company", value: input.company || "Not provided" },
                  { name: "Category", value: input.category },
                ],
              },
            ],
          });
        }
      } catch (teamsErr) {
        console.error("[Form Submission] Failed to send Teams notification:", teamsErr);
      }

      // Notify owner
      try {
        await notifyOwner({
          title: "New IT Discovery Form Submission",
          content: `${input.name} from ${input.company || "Unknown"} submitted an IT discovery form. Email: ${input.email}`,
        });
      } catch (notifyErr) {
        console.error("[Form Submission] Failed to notify owner:", notifyErr);
      }

      return {
        success: true,
        message: "Form submitted successfully",
        submissionId,
      };
    }),

  // Admin: Get all submissions
  getAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    return await db
      .select()
      .from(formSubmissions)
      .orderBy(desc(formSubmissions.submittedAt));
  }),

  // Admin: Get submission by ID
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.id, input.id));

      return result[0] || null;
    }),

  // Admin: Update submission status
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "converted", "spam"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(formSubmissions)
        .set({
          status: input.status,
          contactedAt: input.status === "contacted" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null,
        })
        .where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Delete submission
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(formSubmissions)
        .where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Bulk delete submissions
  bulkDelete: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      if (input.ids.length === 0) {
        throw new Error("No submissions selected for deletion");
      }

      for (const id of input.ids) {
        await db
          .delete(formSubmissions)
          .where(eq(formSubmissions.id, id));
      }

      return { success: true, deletedCount: input.ids.length };
    }),
});
