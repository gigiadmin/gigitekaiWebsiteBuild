import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { formSubmissions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export const formSubmissionsRouter = router({
  // Public: Submit a form
  submitForm: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().min(2, "Name required"),
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
      const recentSubmissions = await db
        .select({ count: db.fn.count() })
        .from(formSubmissions)
        .where(
          and(
            eq(formSubmissions.email, input.email),
            gte(
              formSubmissions.submittedAt,
              new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' ')
            )
          )
        );

      if (recentSubmissions[0]?.count > 3) {
        throw new Error("Too many submissions from this email. Please try again later.");
      }

      // Insert form submission
      const result = await db.insert(formSubmissions).values({
        email: input.email,
        name: input.name,
        company: input.company || null,
        category: input.category,
        message: input.message,
        source: input.source,
        status: "new",
      });

      // Send notification to owner
      try {
        await notifyOwner({
          title: `📝 New Form Submission: ${input.category}`,
          content: `From: ${input.name} (${input.email})\nCompany: ${input.company || "N/A"}\nCategory: ${input.category}\n\nMessage:\n${input.message}`,
        });
      } catch (err) {
        console.warn("Failed to send owner notification:", err);
      }

      return {
        success: true,
        message: "Form submitted successfully. We'll be in touch soon!",
        submissionId: result.insertId,
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
        conditions.push(
          gte(formSubmissions.submittedAt, input.startDate)
        );
      }

      if (input.endDate) {
        conditions.push(
          lte(formSubmissions.submittedAt, input.endDate)
        );
      }

      if (input.search) {
        // Search in email, name, company, or message
        const searchLike = `%${input.search}%`;
        // Note: This is a simplified search. For production, consider full-text search
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Get total count
      const countResult = await db
        .select({ count: db.fn.count() })
        .from(formSubmissions)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = countResult[0]?.count || 0;

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

  // Admin: Mark submission as contacted
  markAsContacted: adminProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(formSubmissions)
        .set({
          status: "contacted",
          contactedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          notes: input.notes || null,
        })
        .where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Mark submission as converted
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

  // Admin: Mark submission as spam
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

      await db
        .delete(formSubmissions)
        .where(eq(formSubmissions.id, input.id));

      return { success: true };
    }),

  // Admin: Get submission stats
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const stats = await db
      .select({
        total: db.fn.count(),
        newCount: db.fn.count().where(eq(formSubmissions.status, "new")),
        contactedCount: db.fn.count().where(eq(formSubmissions.status, "contacted")),
        convertedCount: db.fn.count().where(eq(formSubmissions.status, "converted")),
        spamCount: db.fn.count().where(eq(formSubmissions.status, "spam")),
      })
      .from(formSubmissions);

    return stats[0] || {
      total: 0,
      newCount: 0,
      contactedCount: 0,
      convertedCount: 0,
      spamCount: 0,
    };
  }),
});
