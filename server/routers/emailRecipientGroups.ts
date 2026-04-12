/**
 * Email Recipient Groups Router — Manage groups for targeted email campaigns
 *
 * Features:
 *  - Create, read, update, delete recipient groups
 *  - Add/remove members from groups
 *  - List all groups and their members
 */
import { z } from "zod";
import { getDb } from "../db";
import { emailRecipientGroups, emailGroupMembers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";

export const emailRecipientGroupsRouter = router({
  // ── Create a new recipient group ──────────────────────────────────────────
  createGroup: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Group name required"),
        description: z.string().optional(),
        type: z.enum(["newsletter_subscribers", "customers", "custom"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const result = await db
          .insert(emailRecipientGroups)
          .values({
            name: input.name,
            description: input.description,
            type: input.type,
            createdBy: ctx.user.id,
          })
          .$returningId();

        return { success: true, groupId: result[0].id };
      } catch (error) {
        console.error("[Email Groups] Create failed:", error);
        throw error;
      }
    }),

  // ── List all recipient groups ────────────────────────────────────────────
  listGroups: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];

      const groups = await db
        .select()
        .from(emailRecipientGroups)
        .orderBy(emailRecipientGroups.name);

      // Get member count for each group
      const groupsWithCounts = await Promise.all(
        groups.map(async (group) => {
          const members = await db
            .select()
            .from(emailGroupMembers)
            .where(eq(emailGroupMembers.groupId, group.id));
          return { ...group, memberCount: members.length };
        })
      );

      return groupsWithCounts;
    } catch (error) {
      console.error("[Email Groups] List failed:", error);
      return [];
    }
  }),

  // ── Get a specific group with all members ─────────────────────────────────
  getGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return null;

        const group = await db
          .select()
          .from(emailRecipientGroups)
          .where(eq(emailRecipientGroups.id, input.groupId))
          .limit(1);

        if (group.length === 0) return null;

        const members = await db
          .select()
          .from(emailGroupMembers)
          .where(eq(emailGroupMembers.groupId, input.groupId));

        return { ...group[0], members };
      } catch (error) {
        console.error("[Email Groups] Get failed:", error);
        return null;
      }
    }),

  // ── Update a recipient group ─────────────────────────────────────────────
  updateGroup: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;

        await db
          .update(emailRecipientGroups)
          .set(updates)
          .where(eq(emailRecipientGroups.id, input.groupId));

        return { success: true };
      } catch (error) {
        console.error("[Email Groups] Update failed:", error);
        throw error;
      }
    }),

  // ── Delete a recipient group ─────────────────────────────────────────────
  deleteGroup: adminProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Delete all members first
        await db
          .delete(emailGroupMembers)
          .where(eq(emailGroupMembers.groupId, input.groupId));

        // Delete the group
        await db
          .delete(emailRecipientGroups)
          .where(eq(emailRecipientGroups.id, input.groupId));

        return { success: true };
      } catch (error) {
        console.error("[Email Groups] Delete failed:", error);
        throw error;
      }
    }),

  // ── Add members to a group ───────────────────────────────────────────────
  addMembers: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        members: z.array(
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Check for duplicates and skip existing members
        const existingEmails = await db
          .select({ email: emailGroupMembers.email })
          .from(emailGroupMembers)
          .where(eq(emailGroupMembers.groupId, input.groupId));

        const existingSet = new Set(existingEmails.map((m) => m.email));
        const newMembers = input.members.filter((m) => !existingSet.has(m.email));

        if (newMembers.length === 0) {
          return { success: true, added: 0 };
        }

        await db.insert(emailGroupMembers).values(
          newMembers.map((m) => ({
            groupId: input.groupId,
            email: m.email,
            name: m.name,
          }))
        );

        return { success: true, added: newMembers.length };
      } catch (error) {
        console.error("[Email Groups] Add members failed:", error);
        throw error;
      }
    }),

  // ── Remove a member from a group ──────────────────────────────────────────
  removeMember: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db
          .delete(emailGroupMembers)
          .where(
            and(
              eq(emailGroupMembers.groupId, input.groupId),
              eq(emailGroupMembers.email, input.email)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Email Groups] Remove member failed:", error);
        throw error;
      }
    }),

  // ── Get all emails in a group (for bulk sending) ──────────────────────────
  getGroupEmails: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const members = await db
          .select({ email: emailGroupMembers.email })
          .from(emailGroupMembers)
          .where(eq(emailGroupMembers.groupId, input.groupId));

        return members.map((m) => m.email);
      } catch (error) {
        console.error("[Email Groups] Get emails failed:", error);
        return [];
      }
    }),
});
