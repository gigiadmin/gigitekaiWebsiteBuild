import crypto from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { conversionEvents, websiteAssessments } from "../../drizzle/schema";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import { sendPublicFormSupportNotification } from "../_core/publicFormSupportNotification";
import { publicProcedure, router } from "../_core/trpc";
import { getAdminFromRequest } from "./admin-auth";
import { scoreTechnologyAssessment } from "../../shared/technologyAssessment";
import { sendEmail } from "../_core/email";

const assessmentDimensions = z.object({
  identity: z.number().int().min(0).max(4),
  security: z.number().int().min(0).max(4),
  resilience: z.number().int().min(0).max(4),
  service: z.number().int().min(0).max(4),
  automation: z.number().int().min(0).max(4),
});

const conversionEventName = z.enum([
  "homepage_pathway_selected",
  "assessment_opened",
  "roi_opened",
  "workflow_gallery_opened",
  "trust_center_opened",
  "workflow_demo_viewed",
  "roi_scenario_calculated",
  "roi_scenario_printed",
  "aria_opened",
  "aria_message_sent",
]);

const conversionRateLimit = new Map<string, { count: number; resetAt: number }>();

function allowConversionEvent(key: string) {
  const now = Date.now();
  const current = conversionRateLimit.get(key);
  if (!current || now >= current.resetAt) {
    conversionRateLimit.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (current.count >= 60) return false;
  current.count += 1;
  return true;
}

export const websiteExpansionRouter = router({
  trackConversion: publicProcedure
    .input(z.object({
      eventName: conversionEventName,
      pageUrl: z.string().min(1).max(500),
      elementId: z.string().max(180).optional(),
      sessionId: z.string().max(120).optional(),
      metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const rateLimitKey = input.sessionId || ctx.req?.ip || "anonymous";
      if (!allowConversionEvent(rateLimitKey)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Conversion event rate limit exceeded" });
      }
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(conversionEvents).values({
        ...input,
        userId: ctx.user?.id,
        metadata: input.metadata ?? null,
      });
      return { success: true };
    }),

  submitAssessment: publicProcedure
    .input(z.object({
      name: z.string().trim().min(2).max(180),
      company: z.string().trim().min(2).max(255),
      email: z.string().email().max(320),
      employees: z.number().int().min(1).max(100000),
      priority: z.string().trim().min(2).max(120),
      dimensions: assessmentDimensions,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Assessment service is temporarily unavailable");
      const { score, maturityLevel, recommendations } = scoreTechnologyAssessment(input.dimensions);
      const publicId = crypto.randomBytes(24).toString("hex");
      await db.insert(websiteAssessments).values({
        publicId,
        name: input.name,
        company: input.company,
        email: input.email,
        employees: input.employees,
        priority: input.priority,
        overallScore: score,
        maturityLevel,
        recommendations,
        inputs: input.dimensions,
      });
      await db.insert(conversionEvents).values({
        eventName: "assessment_completed",
        pageUrl: "/assessment",
        elementId: "technology-maturity-assessment",
        metadata: { priority: input.priority, employees: input.employees, score },
      });
      notifyOwner({
        title: `Technology assessment completed: ${input.company}`,
        content: `${input.name} (${input.email}) completed the assessment with a score of ${score}/100 and priority ${input.priority}.`,
      }).catch((error) => console.warn("[Website Expansion] Owner notification failed", error));
      await sendPublicFormSupportNotification({
        formName: "Technology Maturity Assessment",
        submitterName: input.name,
        submitterEmail: input.email,
        fields: {
          Company: input.company,
          Employees: input.employees,
          Priority: input.priority,
          Score: `${score}/100`,
          "Maturity level": maturityLevel,
          Recommendations: recommendations.join("\n"),
          "Report ID": publicId,
        },
      });
      await sendEmail({
        to: input.email,
        subject: `Your GigitekAI technology assessment — ${maturityLevel}`,
        replyTo: "support@gigitekai.com",
        html: `<p>Hi ${input.name},</p><p>Your technology maturity assessment is complete. Your score is <strong>${score}/100</strong> with a maturity level of <strong>${maturityLevel}</strong>.</p><p><a href="https://gigitekai.com/assessment/report/${publicId}">View and print your executive report</a></p><p>Questions? Contact support@gigitekai.com or call 609-676-4483.</p>`,
      });
      return { publicId, score, maturityLevel, recommendations };
    }),

  getAssessment: publicProcedure
    .input(z.object({ publicId: z.string().length(48) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [assessment] = await db
        .select({
          publicId: websiteAssessments.publicId,
          name: websiteAssessments.name,
          company: websiteAssessments.company,
          employees: websiteAssessments.employees,
          priority: websiteAssessments.priority,
          overallScore: websiteAssessments.overallScore,
          maturityLevel: websiteAssessments.maturityLevel,
          recommendations: websiteAssessments.recommendations,
          inputs: websiteAssessments.inputs,
          createdAt: websiteAssessments.createdAt,
        })
        .from(websiteAssessments)
        .where(eq(websiteAssessments.publicId, input.publicId))
        .limit(1);
      return assessment ?? null;
    }),

  getConversionAnalytics: publicProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input, ctx }) => {
      const admin = ctx.req ? await getAdminFromRequest(ctx.req) : null;
      if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
      const db = await getDb();
      if (!db) return { totals: [], recent: [] };
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const totals = await db
        .select({ eventName: conversionEvents.eventName, count: sql<number>`count(*)` })
        .from(conversionEvents)
        .where(gte(conversionEvents.createdAt, startDate.toISOString().slice(0, 19).replace("T", " ")))
        .groupBy(conversionEvents.eventName)
        .orderBy(desc(sql<number>`count(*)`));
      const recent = await db
        .select()
        .from(conversionEvents)
        .where(gte(conversionEvents.createdAt, startDate.toISOString().slice(0, 19).replace("T", " ")))
        .orderBy(desc(conversionEvents.createdAt))
        .limit(100);
      return { totals, recent };
    }),
});
