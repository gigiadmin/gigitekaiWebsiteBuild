import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { formSubmissions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { sendToTeamsWithRetry, resolveWebhookUrl } from "../_core/teamsWebhookUtils";

const escapeHtml = (value: string | null | undefined): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const limitInternalNotification = (value: string, maxLength = 16_000): string =>
  value.length > maxLength
    ? `${value.slice(0, maxLength)}\n\n[Form detail truncated in this notification. View the complete submission in the admin portal.]`
    : value;

export const buildFormSubmissionSupportEmail = (
  input: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    category: string;
    source: string;
    message: string;
  },
  submissionId: number | string
): string => {
  const safe = {
    name: escapeHtml(input.name),
    email: escapeHtml(input.email),
    phone: escapeHtml(input.phone),
    company: escapeHtml(input.company || "Not provided"),
    category: escapeHtml(input.category),
    source: escapeHtml(input.source),
    message: escapeHtml(input.message),
    submissionId: escapeHtml(String(submissionId)),
  };

  return `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#0f172a;">
      <h2 style="color:#0891b2;">New IT Discovery Form — Complete Submission</h2>
      <p>A new website intake form was submitted. The complete responses are included below for follow-up.</p>
      <h3>Contact Information</h3>
      <table role="presentation" style="border-collapse:collapse;width:100%;margin:0 0 18px;">
        <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;width:32%;">Name</td><td style="padding:8px;border:1px solid #cbd5e1;">${safe.name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Email</td><td style="padding:8px;border:1px solid #cbd5e1;"><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
        <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Phone</td><td style="padding:8px;border:1px solid #cbd5e1;">${safe.phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Company</td><td style="padding:8px;border:1px solid #cbd5e1;">${safe.company}</td></tr>
      </table>
      <h3>Submission Details</h3>
      <table role="presentation" style="border-collapse:collapse;width:100%;margin:0 0 18px;">
        <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;width:32%;">Category</td><td style="padding:8px;border:1px solid #cbd5e1;">${safe.category}</td></tr>
        <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Source</td><td style="padding:8px;border:1px solid #cbd5e1;">${safe.source}</td></tr>
        <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Submission ID</td><td style="padding:8px;border:1px solid #cbd5e1;">${safe.submissionId}</td></tr>
      </table>
      <h3>Complete Form Responses</h3>
      <pre style="white-space:pre-wrap;word-wrap:break-word;background:#f1f5f9;border:1px solid #cbd5e1;padding:16px;border-radius:6px;font-family:Arial,sans-serif;line-height:1.55;">${safe.message}</pre>
      <p style="margin-top:22px;"><a href="https://gigitekai.com/admin/form-submissions" style="background:#00D4FF;color:#0A0E1A;padding:10px 18px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:700;">Review in Admin Portal</a></p>
    </div>
  `;
};

export const buildFormSubmissionOwnerAlert = (
  input: { name: string; email: string; phone: string; company?: string; category: string; source: string; message: string },
  submissionId: number | string
): string =>
  limitInternalNotification(
    [
      `A new IT Discovery form was submitted by ${input.name} from ${input.company || "Unknown"}.`,
      `Email: ${input.email}`,
      `Phone: ${input.phone}`,
      `Category: ${input.category}`,
      `Source: ${input.source}`,
      `Submission ID: ${submissionId}`,
      "",
      "COMPLETE FORM RESPONSES:",
      input.message,
      "",
      "Review in the admin portal: https://gigitekai.com/admin/form-submissions",
    ].join("\n")
  );

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
        const confirmationSent = await sendEmail({
          to: input.email,
          subject: "We Received Your IT Discovery Request",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #00D4FF;">Thank You for Your Submission</h2>
              <p>Hi ${escapeHtml(input.name)},</p>
              <p>We've received your IT Discovery intake form and appreciate you taking the time to share details about your business needs.</p>
              <h3>What's Next?</h3>
              <p>Our team will review your submission and reach out within 24 business hours to discuss your specific requirements and how GigitekAI can help transform your IT infrastructure.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Submission Details:</strong></p>
                <p>Company: ${escapeHtml(input.company || "Not provided")}</p>
                <p>Category: ${escapeHtml(input.category)}</p>
                <p>Reference ID: ${escapeHtml(String(submissionId))}</p>
              </div>
              <p>If you have any immediate questions, feel free to contact us at <strong>support@gigitekai.com</strong> or call <strong>+1 727-382-6909</strong>.</p>
              <p>Best regards,<br/>The GigitekAI Team</p>
            </div>
          `,
        });
        if (!confirmationSent) {
          console.error("[Form Submission] Confirmation email was not accepted by Microsoft Graph");
        }
      } catch (emailErr) {
        console.error("[Form Submission] Failed to send confirmation email:", emailErr);
      }

      // Send notification email to support
      try {
        const supportEmailSent = await sendEmail({
          to: "support@gigitekai.com",
          subject: `New IT Discovery Form — Complete Details: ${input.name} from ${input.company || "Unknown"}`,
          html: buildFormSubmissionSupportEmail(input, submissionId),
          replyTo: input.email,
        });
        if (!supportEmailSent) {
          console.error("[Form Submission] Detailed support notification was not accepted by Microsoft Graph");
        }
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
          content: buildFormSubmissionOwnerAlert(input, submissionId),
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
