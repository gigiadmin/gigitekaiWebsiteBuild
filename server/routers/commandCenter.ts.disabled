import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  commandCenterWidgets,
  commandCenterCommands,
  commandCenterSavedCommands,
  commandCenterAuditLogs,
  CommandCenterWidget,
  InsertCommandCenterWidget,
  CommandCenterCommand,
  InsertCommandCenterCommand,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

/**
 * Intent Parser: Translates natural language to structured command
 * Uses LLM with JSON schema for reliable intent extraction
 */
async function parseCommandIntent(input: string, userId: number) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a command intent parser for GigitekAI's Command Center.
Analyze natural language commands and extract:
- intent: one of [query_uptime, query_agents, query_email, query_tickets, query_alerts, query_api_status, create_alert, update_widget, execute_action]
- entities: key-value pairs like {domain: "gigitekai.com", period: "7d", agentId: 123}
- confidence: 0.0-1.0 confidence in the intent

Be precise and extract only what's explicitly mentioned.` as any,
        },
        {
          role: "user",
          content: input as any,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "command_intent",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: [
                  "query_uptime",
                  "query_agents",
                  "query_email",
                  "query_tickets",
                  "query_alerts",
                  "query_api_status",
                  "create_alert",
                  "update_widget",
                  "execute_action",
                ],
              },
              entities: {
                type: "object",
                additionalProperties: true,
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
            },
            required: ["intent", "entities", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    return {
      intent: parsed.intent || "query_uptime",
      entities: parsed.entities || {},
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error("[CommandCenter] Intent parsing failed:", error);
    // Fallback to safe default
    return {
      intent: "query_uptime",
      entities: {},
      confidence: 0,
    };
  }
}

/**
 * Execute Command: Processes parsed intent and returns results
 * This is where we'd integrate with UptimeRobot, Teams, M365, etc.
 */
async function executeCommand(
  intent: string,
  entities: Record<string, any>
) {
  const startTime = Date.now();

  try {
    switch (intent) {
      case "query_uptime": {
        // Placeholder: Would call UptimeRobot API
        return {
          status: "success",
          result: {
            uptime: 99.9,
            lastIncident: "2026-05-25T10:30:00Z",
            incidents: [],
          },
        };
      }

      case "query_agents": {
        // Placeholder: Would query agents table
        return {
          status: "success",
          result: {
            totalAgents: 5,
            onlineAgents: 3,
            busyAgents: 2,
            idleAgents: 1,
          },
        };
      }

      case "query_email": {
        // Placeholder: Would query email metrics
        return {
          status: "success",
          result: {
            inboxCount: 12,
            unreadCount: 3,
            todayReceived: 45,
          },
        };
      }

      case "query_tickets": {
        // Placeholder: Would query ticket metrics
        return {
          status: "success",
          result: {
            openTickets: 8,
            inProgressTickets: 5,
            unassignedTickets: 2,
            averageResolutionTime: "4.2 hours",
          },
        };
      }

      case "query_alerts": {
        // Placeholder: Would query active alerts
        return {
          status: "success",
          result: {
            activeAlerts: 2,
            criticalAlerts: 0,
            warningAlerts: 2,
          },
        };
      }

      case "query_api_status": {
        // Placeholder: Would check API health
        return {
          status: "success",
          result: {
            microsoftGraph: "healthy",
            twilio: "healthy",
            sendgrid: "healthy",
            uptimerobot: "healthy",
          },
        };
      }

      default:
        return {
          status: "partial",
          result: { message: "Intent not yet implemented" },
        };
    }
  } catch (error) {
    console.error("[CommandCenter] Execution error:", error);
    return {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const commandCenterRouter = router({
  // ─────────────────────────────────────────────────────────────
  // Widget Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all widgets for the current user
   */
  getWidgets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const widgets = await db
      .select()
      .from(commandCenterWidgets)
      .where(eq(commandCenterWidgets.userId, ctx.user.id))
      .orderBy(commandCenterWidgets.position);

    return widgets.map((w: any) => ({
      id: w.id,
      widgetType: w.widgetType,
      title: w.title,
      position: w.position,
      isVisible: w.isVisible === 1,
      refreshInterval: w.refreshInterval,
      config: w.config ? JSON.parse(w.config as string) : undefined,
    }));
  }),

  /**
   * Add a new widget for the current user
   */
  addWidget: protectedProcedure
    .input(
      z.object({
        widgetType: z.enum([
          "uptime",
          "agents",
          "email",
          "tickets",
          "alerts",
          "api_status",
        ]),
        title: z.string().min(1),
        config: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get max position to append at end
      const existing = await db
        .select()
        .from(commandCenterWidgets)
        .where(eq(commandCenterWidgets.userId, ctx.user.id))
        .orderBy(desc(commandCenterWidgets.position))
        .limit(1);

      const nextPosition = (existing[0]?.position ?? -1) + 1;

      const result = await db
        .insert(commandCenterWidgets)
        .values({
          userId: ctx.user.id,
          widgetType: input.widgetType,
          title: input.title,
          position: nextPosition,
          isVisible: 1,
          config: input.config ? JSON.stringify(input.config) : null,
        } as any);

      // Return the created widget
      const newWidget = await db
        .select()
        .from(commandCenterWidgets)
        .where(eq(commandCenterWidgets.id, (result as any)[0]))
        .then((rows: CommandCenterWidget[]) => rows[0]);

      return {
        id: newWidget.id,
        widgetType: newWidget.widgetType,
        title: newWidget.title,
        position: newWidget.position,
        isVisible: newWidget.isVisible === 1,
        refreshInterval: newWidget.refreshInterval,
        config: newWidget.config
          ? JSON.parse(newWidget.config as string)
          : undefined,
      };
    }),

  /**
   * Update widget visibility
   */
  toggleWidgetVisibility: protectedProcedure
    .input(
      z.object({
        widgetId: z.number(),
        isVisible: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const widget = await db
        .select()
        .from(commandCenterWidgets)
        .where(eq(commandCenterWidgets.id, input.widgetId));

      if (!widget.length || widget[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Widget not found or access denied",
        });
      }

      await db
        .update(commandCenterWidgets)
        .set({ isVisible: input.isVisible ? 1 : 0 })
        .where(eq(commandCenterWidgets.id, input.widgetId));

      return { success: true };
    }),

  /**
   * Delete a widget
   */
  deleteWidget: protectedProcedure
    .input(z.object({ widgetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const widget = await db
        .select()
        .from(commandCenterWidgets)
        .where(eq(commandCenterWidgets.id, input.widgetId));

      if (!widget.length || widget[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Widget not found or access denied",
        });
      }

      await db
        .delete(commandCenterWidgets)
        .where(eq(commandCenterWidgets.id, input.widgetId));

      return { success: true };
    }),

  /**
   * Reorder widgets by updating positions
   */
  updateWidgetOrder: protectedProcedure
    .input(
      z.object({
        widgetId: z.number(),
        newPosition: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const widget = await db
        .select()
        .from(commandCenterWidgets)
        .where(eq(commandCenterWidgets.id, input.widgetId));

      if (!widget.length || widget[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Widget not found or access denied",
        });
      }

      await db
        .update(commandCenterWidgets)
        .set({ position: input.newPosition })
        .where(eq(commandCenterWidgets.id, input.widgetId));

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────
  // Command Execution
  // ─────────────────────────────────────────────────────────────

  /**
   * Execute a natural language command
   */
  executeCommand: protectedProcedure
    .input(z.object({ input: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const startTime = Date.now();

      // Parse intent
      const { intent, entities, confidence } = await parseCommandIntent(
        input.input,
        ctx.user.id
      );

      // Execute command
      const execution = await executeCommand(intent, entities);
      const executionTime = Date.now() - startTime;

      // Store command in history
      const result = await db
        .insert(commandCenterCommands)
        .values({
          userId: ctx.user.id,
          rawInput: input.input,
          intent,
          entities: JSON.stringify(entities),
          result: execution.result ? JSON.stringify(execution.result) : null,
          executionTime,
          status: execution.status as "success" | "partial" | "failed",
          errorMessage: execution.errorMessage || null,
          isSaved: 0,
        } as any);

      // Log audit
      await db.insert(commandCenterAuditLogs).values({
        userId: ctx.user.id,
        action: "execute_command",
        resource: intent,
        details: JSON.stringify({ input: input.input, intent, entities }),
        result: execution.status,
        ipAddress: ctx.req.ip || "unknown",
        userAgent: ctx.req.headers["user-agent"] || "unknown",
      } as any);

      return {
        id: (result as any)[0],
        intent,
        status: execution.status,
        result: execution.result,
        errorMessage: execution.errorMessage,
        executionTime,
      };
    }),

  // ─────────────────────────────────────────────────────────────
  // Saved Commands
  // ─────────────────────────────────────────────────────────────

  /**
   * Get saved commands for the current user
   */
  getSavedCommands: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const commands = await db
      .select()
      .from(commandCenterSavedCommands)
      .where(eq(commandCenterSavedCommands.userId, ctx.user.id))
      .orderBy(desc(commandCenterSavedCommands.usageCount));

    return commands.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      commandTemplate: c.commandTemplate,
      defaultEntities: c.defaultEntities
        ? JSON.parse(c.defaultEntities as string)
        : {},
      category: c.category,
      usageCount: c.usageCount,
    }));
  }),

  /**
   * Save a command for quick access
   */
  saveCommand: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        commandTemplate: z.string().min(1),
        defaultEntities: z.record(z.string(), z.unknown()).optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db
        .insert(commandCenterSavedCommands)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
          commandTemplate: input.commandTemplate,
          defaultEntities: input.defaultEntities
            ? JSON.stringify(input.defaultEntities)
            : null,
          category: input.category || null,
          isPublic: 0,
          usageCount: 0,
        } as any);

      return { id: (result as any)[0], success: true };
    }),

  /**
   * Delete a saved command
   */
  deleteSavedCommand: protectedProcedure
    .input(z.object({ commandId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const command = await db
        .select()
        .from(commandCenterSavedCommands)
        .where(eq(commandCenterSavedCommands.id, input.commandId));

      if (!command.length || command[0].userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Command not found or access denied",
        });
      }

      await db
        .delete(commandCenterSavedCommands)
        .where(eq(commandCenterSavedCommands.id, input.commandId) as any);

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────
  // Command History
  // ─────────────────────────────────────────────────────────────

  /**
   * Get recent command history
   */
  getCommandHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const commands = await db
        .select()
        .from(commandCenterCommands)
        .where(eq(commandCenterCommands.userId, ctx.user.id))
        .orderBy(desc(commandCenterCommands.createdAt))
        .limit(input.limit);

      return commands.map((c: any) => ({
        id: c.id,
        rawInput: c.rawInput,
        intent: c.intent,
        status: c.status,
        result: c.result ? JSON.parse(c.result as string) : null,
        errorMessage: c.errorMessage,
        executionTime: c.executionTime,
        createdAt: c.createdAt,
      }));
    }),
});
