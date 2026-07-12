import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getRecentWorkflowExecutions,
  getActiveWorkflowTemplates,
  getWorkflowTemplatesByCategory,
  createWorkflowTemplate,
  saveWorkflowExecution,
} from "../db-workflow";

export const workflowTemplatesRouter = router({
  /**
   * Get recent workflow executions (history)
   */
  getRecentExecutions: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      try {
        const executions = await getRecentWorkflowExecutions(input.limit);
        return {
          success: true,
          data: executions,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch executions",
        };
      }
    }),

  /**
   * Get all active workflow templates
   */
  getTemplates: protectedProcedure.query(async () => {
    try {
      const templates = await getActiveWorkflowTemplates();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch templates",
      };
    }
  }),

  /**
   * Get workflow templates by category
   */
  getTemplatesByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      try {
        const templates = await getWorkflowTemplatesByCategory(input.category);
        return {
          success: true,
          data: templates,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fetch templates",
        };
      }
    }),

  /**
   * Create a new workflow template
   */
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        category: z.string(),
        steps: z.array(
          z.object({
            name: z.string(),
            system: z.string(),
            action: z.string(),
            params: z.record(z.string(), z.any()).optional(),
          })
        ),
        parameters: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            required: z.boolean(),
            description: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const template = await createWorkflowTemplate({
          ...input,
          createdBy: ctx.user.id,
        });
        return {
          success: true,
          data: template,
          message: `Template "${input.name}" created successfully`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create template",
        };
      }
    }),

  /**
   * Save workflow execution (called after workflow completes)
   */
  saveExecution: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        workflowName: z.string(),
        parameters: z.record(z.string(), z.any()),
        status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
        steps: z
          .array(
            z.object({
              system: z.string(),
              status: z.string(),
              progress: z.number(),
              details: z.string().optional(),
            })
          )
          .optional(),
        result: z.record(z.string(), z.any()).optional(),
        errorMessage: z.string().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await saveWorkflowExecution({
          ...input,
          initiatedBy: ctx.user.id,
        });
        return {
          success: true,
          message: `Workflow "${input.workflowName}" execution saved`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to save execution",
        };
      }
    }),
});
