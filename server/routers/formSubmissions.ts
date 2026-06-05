import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { formSubmissions } from "../../drizzle/schema";
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
      let query = db.select().from(formSubmissions);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Get total count
      let countQuery = db
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
