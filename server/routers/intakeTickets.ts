import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db"; // Correct import for getDb
import { intakeTickets } from "../../drizzle/schema";
import { eq, like, or, and } from "drizzle-orm";

export const intakeTicketsRouter = router({
  listForAdmin: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const { status, search, limit, offset } = input;
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = db.select().from(intakeTickets).$dynamic();

      const whereConditions: any[] = [];
      if (status) {
        whereConditions.push(eq(intakeTickets.status, status as any));
      }
      if (search) {
        whereConditions.push(or(
          like(intakeTickets.creatorName, `%${search}%`),
          like(intakeTickets.creatorEmail, `%${search}%`),
          like(intakeTickets.subject, `%${search}%`),
        ));
      }

      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }

      const submissions = await query.limit(limit).offset(offset);
      const total = await db.select().from(intakeTickets).where(and(...whereConditions)).execute().then(res => res.length);

      return {
        total,
        submissions: submissions.map(submission => ({
          id: submission.id,
          creatorName: submission.creatorName,
          creatorEmail: submission.creatorEmail,
          companyName: submission.intakeData ? (submission.intakeData as any).companyName : null, // Assuming companyName is in intakeData
          subject: submission.subject,
          status: submission.status,
          priority: submission.priority,
          createdAt: submission.createdAt,
          intakeData: submission.intakeData,
        })),
      };
    }),
});
