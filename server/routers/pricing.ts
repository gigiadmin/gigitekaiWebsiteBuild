import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { pricingTiers, roiCalculations, pricingAnalytics } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const pricingRouter = router({
  // Get all pricing tiers
  listTiers: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const tiers = await db.select().from(pricingTiers).orderBy(pricingTiers.monthlyPrice);
    return tiers.map((tier: any) => ({
      ...tier,
      features: JSON.parse(tier.features || "[]"),
    }));
  }),

  // Get single tier by name
  getTier: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const tier = await db
        .select()
        .from(pricingTiers)
        .where(eq(pricingTiers.name, input.name))
        .limit(1);

      if (!tier.length) return null;
      return {
        ...tier[0],
        features: JSON.parse(tier[0].features || "[]"),
      };
    }),

  // Calculate ROI based on user inputs
  calculateROI: publicProcedure
    .input(
      z.object({
        currentEmployees: z.number().min(1).max(10000),
        ticketsPerMonth: z.number().min(1).max(100000),
        avgResolutionTime: z.number().min(0.5).max(168), // hours
        costPerHour: z.number().min(10).max(500),
        tierName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Calculate time savings (assuming 30% efficiency improvement)
      const timeSavingsPercentage = 0.30;
      const hoursPerMonth = input.ticketsPerMonth * input.avgResolutionTime;
      const savedHoursPerMonth = hoursPerMonth * timeSavingsPercentage;
      const monthlySavings = savedHoursPerMonth * input.costPerHour;
      const annualSavings = monthlySavings * 12;

      // Get tier pricing if provided
      let tierCost = 0;
      if (input.tierName) {
        const tier = await db
          .select()
          .from(pricingTiers)
          .where(eq(pricingTiers.name, input.tierName))
          .limit(1);
        if (tier.length) {
          tierCost = Number(tier[0].annualPrice);
        }
      }

      // Calculate ROI
      const netSavings = annualSavings - tierCost;
      const roiPercentage = tierCost > 0 ? (netSavings / tierCost) * 100 : 0;
      const paybackMonths = tierCost > 0 ? tierCost / monthlySavings : 0;

      // Save calculation
      const calculation = await db.insert(roiCalculations).values({
        userId: ctx.user?.id || null,
        tierName: input.tierName || null,
        currentEmployees: input.currentEmployees,
        ticketsPerMonth: input.ticketsPerMonth,
        avgResolutionTime: input.avgResolutionTime.toString(),
        costPerHour: input.costPerHour.toString(),
        estimatedSavings: annualSavings.toString(),
        paybackPeriod: paybackMonths.toString(),
        roiPercentage: roiPercentage.toString(),
      } as any);

      return {
        success: true,
        monthlySavings: Math.round(monthlySavings),
        annualSavings: Math.round(annualSavings),
        netSavings: Math.round(netSavings),
        roiPercentage: Math.round(roiPercentage * 100) / 100,
        paybackMonths: Math.round(paybackMonths * 10) / 10,
        calculationId: calculation[0].insertId,
      };
    }),

  // Get ROI calculation history
  getCalculationHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const calculations = await db
      .select()
      .from(roiCalculations)
      .where(eq(roiCalculations.userId, ctx.user.id))
      .orderBy(desc(roiCalculations.createdAt))
      .limit(10);

    return calculations;
  }),

  // Admin: Create or update pricing tier
  createTier: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        monthlyPrice: z.number().min(0),
        annualPrice: z.number().min(0),
        isPopular: z.boolean().optional(),
        features: z.array(z.string()),
        maxUsers: z.number().optional(),
        maxTickets: z.number().optional(),
        maxStorage: z.number().optional(),
        supportLevel: z.string().optional(),
        slaResponse: z.string().optional(),
        slaResolution: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(pricingTiers).values({
        name: input.name,
        description: input.description || null,
        monthlyPrice: input.monthlyPrice.toString(),
        annualPrice: input.annualPrice.toString(),
        isPopular: input.isPopular || false,
        features: JSON.stringify(input.features),
        maxUsers: input.maxUsers || null,
        maxTickets: input.maxTickets || null,
        maxStorage: input.maxStorage || null,
        supportLevel: input.supportLevel || null,
        slaResponse: input.slaResponse || null,
        slaResolution: input.slaResolution || null,
      } as any);

      return {
        success: true,
        tierId: result[0].insertId,
      };
    }),

  // Admin: Update pricing tier
  updateTier: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        monthlyPrice: z.number().optional(),
        annualPrice: z.number().optional(),
        isPopular: z.boolean().optional(),
        features: z.array(z.string()).optional(),
        maxUsers: z.number().optional(),
        maxTickets: z.number().optional(),
        maxStorage: z.number().optional(),
        supportLevel: z.string().optional(),
        slaResponse: z.string().optional(),
        slaResolution: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;
      const updateData: any = { ...updates };
      if (updates.features) {
        updateData.features = JSON.stringify(updates.features);
      }

      await db.update(pricingTiers).set(updateData).where(eq(pricingTiers.id, id));

      return { success: true };
    }),

  // Admin: Delete pricing tier
  deleteTier: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(pricingTiers).where(eq(pricingTiers.id, input.id));
      return { success: true };
    }),

  // Get pricing analytics
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const analytics = await db
      .select()
      .from(pricingAnalytics)
      .orderBy(desc(pricingAnalytics.date))
      .limit(30);

    return analytics.map((a: any) => ({
      ...a,
      tierViews: JSON.parse(a.tierViews || "{}"),
    }));
  }),

  // Track pricing page view
  trackPageView: publicProcedure
    .input(z.object({ tierName: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const today = new Date().toISOString().split("T")[0];

      // Get or create today's analytics
      const existing = await db
        .select()
        .from(pricingAnalytics)
        .where(eq(pricingAnalytics.date, today))
        .limit(1);

      if (existing.length) {
        const tierViews = JSON.parse(existing[0].tierViews || "{}");
        if (input.tierName) {
          tierViews[input.tierName] = (tierViews[input.tierName] || 0) + 1;
        }

        await db
          .update(pricingAnalytics)
          .set({
            pageViews: (existing[0].pageViews || 0) + 1,
            tierViews: JSON.stringify(tierViews),
          })
          .where(eq(pricingAnalytics.date, today));
      } else {
        const tierViews = input.tierName ? { [input.tierName]: 1 } : {};
      await db.insert(pricingAnalytics).values({
        date: today,
        pageViews: 1,
        tierViews: JSON.stringify(tierViews),
      } as any);
      }

      return { success: true };
    }),

  // Track calculator usage
  trackCalculatorUsage: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const today = new Date().toISOString().split("T")[0];

    const existing = await db
      .select()
      .from(pricingAnalytics)
      .where(eq(pricingAnalytics.date, today))
      .limit(1);

    if (existing.length) {
      await db
        .update(pricingAnalytics)
        .set({
          calculatorUsed: (existing[0].calculatorUsed || 0) + 1,
        })
        .where(eq(pricingAnalytics.date, today));
    } else {
      await db.insert(pricingAnalytics).values({
        date: today,
        pageViews: 0,
        calculatorUsed: 1,
      } as any);
    }

    return { success: true };
  }),
});
