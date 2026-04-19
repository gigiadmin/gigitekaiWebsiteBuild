import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { adminMenuCustomization } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const adminMenuCustomizationRouter = router({
  // Save menu customization
  saveMenuCustomization: adminProcedure
    .input(
      z.object({
        menuOrder: z.array(z.string()),
        collapsedSections: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // Check if customization exists for this user
      const existing = await db
        .select()
        .from(adminMenuCustomization)
        .where(eq(adminMenuCustomization.userId, ctx.user.id));

      if (existing.length > 0) {
        // Update existing
        await db
          .update(adminMenuCustomization)
          .set({
            menuOrder: input.menuOrder,
            collapsedSections: input.collapsedSections || [],
            updatedAt: new Date(),
          })
          .where(eq(adminMenuCustomization.userId, ctx.user.id));
      } else {
        // Create new
        await db.insert(adminMenuCustomization).values({
          userId: ctx.user.id,
          menuOrder: input.menuOrder,
          collapsedSections: input.collapsedSections || [],
        });
      }

      return { success: true };
    }),

  // Get menu customization
  getMenuCustomization: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(adminMenuCustomization)
      .where(eq(adminMenuCustomization.userId, ctx.user.id));

    if (result.length === 0) return null;

    return {
      menuOrder: result[0].menuOrder,
      collapsedSections: result[0].collapsedSections,
    };
  }),

  // Reset to default
  resetMenuCustomization: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };

    await db
      .delete(adminMenuCustomization)
      .where(eq(adminMenuCustomization.userId, ctx.user.id));

    return { success: true };
  }),

  // Toggle section collapse
  toggleSectionCollapse: adminProcedure
    .input(
      z.object({
        section: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const result = await db
        .select()
        .from(adminMenuCustomization)
        .where(eq(adminMenuCustomization.userId, ctx.user.id));

      let collapsedSections = result.length > 0 ? result[0].collapsedSections : [];

      if (collapsedSections.includes(input.section)) {
        collapsedSections = collapsedSections.filter((s) => s !== input.section);
      } else {
        collapsedSections = [...collapsedSections, input.section];
      }

      if (result.length > 0) {
        await db
          .update(adminMenuCustomization)
          .set({
            collapsedSections,
            updatedAt: new Date(),
          })
          .where(eq(adminMenuCustomization.userId, ctx.user.id));
      } else {
        await db.insert(adminMenuCustomization).values({
          userId: ctx.user.id,
          menuOrder: [],
          collapsedSections,
        });
      }

      return { success: true, collapsedSections };
    }),
});
