/**
 * Command Execution Router
 * 
 * Handles execution of commands with validation, dry-run, and audit logging
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commandCenterCommands, commandCenterAuditLogs } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

export const commandExecutionRouter = router({
  /**
   * Execute a command with validation and audit logging
   */
  executeCommand: protectedProcedure
    .input(z.object({
      intent: z.string(),
      description: z.string(),
      parameters: z.record(z.string(), z.any()).optional(),
      dryRun: z.boolean().default(false),
      requiresApproval: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const startTime = Date.now();

        // Validate command parameters
        const validationResult = validateCommandParameters(input.intent, input.parameters);
        if (!validationResult.valid) {
          return {
            success: false,
            error: validationResult.error,
            dryRun: input.dryRun,
          };
        }

        // If dry-run, return validation result only
        if (input.dryRun) {
          return {
            success: true,
            dryRun: true,
            message: "Dry-run validation passed. Command is ready to execute.",
            estimatedExecutionTime: "~2-5 seconds",
          };
        }

        // Execute command (placeholder - actual execution would depend on command type)
        let executionResult: { status: "success" | "failed"; output: string; executionTime: number } = {
          status: "success",
          output: `Command "${input.intent}" executed successfully`,
          executionTime: Date.now() - startTime,
        };

        // Simulate command execution
        try {
          // Actual command execution would go here
          // For now, we'll simulate success/failure
          if (Math.random() > 0.05) {
            // 95% success rate
            executionResult.status = "success" as const;
          } else {
            executionResult.status = "failed" as const;
            executionResult.output = `Command "${input.intent}" failed: Simulated error`;
          }
        } catch (execError) {
          executionResult.status = "failed" as const;
          executionResult.output = `Command execution error: ${String(execError)}`;
        }

        // Log command execution
        try {
          await db.insert(commandCenterCommands).values({
            intent: input.intent,
            rawInput: input.description,
            status: executionResult.status,
            executionTime: executionResult.executionTime,
            result: executionResult.output,
            entities: JSON.stringify(input.parameters || {}),
            userId: ctx.user?.id || 0,
          });

          // Log to audit trail
          await db.insert(commandCenterAuditLogs).values({
            action: `command_executed_${input.intent}`,
            resource: input.intent,
            details: JSON.stringify({
              intent: input.intent,
              status: executionResult.status,
              executionTime: executionResult.executionTime,
            }),
            result: executionResult.status,
            userId: ctx.user?.id || 0,
          });
        } catch (logError) {
          console.error("[Command Execution] Error logging command:", logError);
        }

        // Notify owner of execution
        if (executionResult.status === "failed") {
          await notifyOwner({
            title: `Command Execution Failed: ${input.intent}`,
            content: `Command "${input.description}" failed after ${executionResult.executionTime}ms. Error: ${executionResult.output}`,
          });
        }

        return {
          success: true,
          execution: {
            commandId: 0, // Would be actual command ID from database
            intent: input.intent,
            status: executionResult.status,
            executionTime: executionResult.executionTime,
            output: executionResult.output,
            executedAt: new Date().toISOString(),
            executedBy: ctx.user?.name || "System",
          },
          dryRun: false,
        };
      } catch (error) {
        console.error("[Command Execution] Error executing command:", error);
        throw new Error("Failed to execute command");
      }
    }),

  /**
   * Get command execution history
   */
  getExecutionHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      status: z.enum(["success", "failed", "pending"]).optional(),
      days: z.number().min(1).max(90).default(7),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get command history
        const commands = await db.select()
          .from(commandCenterCommands)
          .limit(input?.limit || 50);

        // Filter by status if provided
        let filtered = commands;
        if (input?.status) {
          filtered = commands.filter((cmd: any) => cmd.status === input.status);
        }

        return {
          success: true,
          history: filtered.map((cmd: any) => ({
            commandId: cmd.id,
            intent: cmd.intent,
            description: cmd.description,
            status: cmd.status,
            executionTime: cmd.executionTime,
            executedAt: cmd.createdAt,
            executedBy: cmd.userId,
          })),
          total: filtered.length,
        };
      } catch (error) {
        console.error("[Command Execution] Error getting execution history:", error);
        throw new Error("Failed to get execution history");
      }
    }),

  /**
   * Get command execution statistics
   */
  getExecutionStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get commands
        const commands = await db.select()
          .from(commandCenterCommands);

        // Calculate statistics
        const totalExecuted = commands.length;
        const successCount = commands.filter((c: any) => c.status === "success").length;
        const failureCount = commands.filter((c: any) => c.status === "failed").length;
        const avgExecutionTime = commands.length > 0
          ? commands.reduce((sum: number, cmd: any) => sum + (cmd.executionTime || 0), 0) / commands.length
          : 0;

        // Most executed intents
        const intentCounts: Record<string, number> = {};
        for (const cmd of commands) {
          const intent = (cmd as any).intent;
          intentCounts[intent] = (intentCounts[intent] || 0) + 1;
        }

        const topIntents = Object.entries(intentCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([intent, count]) => ({ intent, count }));

        return {
          success: true,
          stats: {
            totalExecuted,
            successCount,
            failureCount,
            successRate: totalExecuted > 0 ? ((successCount / totalExecuted) * 100).toFixed(1) : "0",
            avgExecutionTime: avgExecutionTime.toFixed(0),
            topIntents,
          },
          period: `${input?.days || 7} days`,
        };
      } catch (error) {
        console.error("[Command Execution] Error getting execution stats:", error);
        throw new Error("Failed to get execution stats");
      }
    }),

  /**
   * Validate command before execution
   */
  validateCommand: protectedProcedure
    .input(z.object({
      intent: z.string(),
      parameters: z.record(z.string(), z.any()).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const validation = validateCommandParameters(input.intent, input.parameters);
        
        return {
          success: validation.valid,
          valid: validation.valid,
          error: validation.error,
          warnings: validation.warnings || [],
          estimatedExecutionTime: "~2-5 seconds",
        };
      } catch (error) {
        console.error("[Command Execution] Error validating command:", error);
        throw new Error("Failed to validate command");
      }
    }),

  /**
   * Get command details and documentation
   */
  getCommandDetails: protectedProcedure
    .input(z.object({
      intent: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const commandDocs = getCommandDocumentation(input.intent);
        
        return {
          success: true,
          command: {
            intent: input.intent,
            description: commandDocs.description,
            parameters: commandDocs.parameters,
            examples: commandDocs.examples,
            riskLevel: commandDocs.riskLevel,
            requiresApproval: commandDocs.requiresApproval,
          },
        };
      } catch (error) {
        console.error("[Command Execution] Error getting command details:", error);
        throw new Error("Failed to get command details");
      }
    }),
});

/**
 * Validate command parameters based on command type
 */
function validateCommandParameters(intent: string, parameters?: Record<string, any>) {
  const validations: Record<string, any> = {
    "create-user": {
      required: ["email", "name"],
      validate: (params: any) => {
        if (!params.email?.includes("@")) return { valid: false, error: "Invalid email format" };
        if (!params.name || params.name.length < 2) return { valid: false, error: "Name must be at least 2 characters" };
        return { valid: true };
      },
    },
    "assign-role": {
      required: ["userId", "role"],
      validate: (params: any) => {
        if (!params.userId) return { valid: false, error: "userId is required" };
        if (!["admin", "user", "viewer"].includes(params.role)) {
          return { valid: false, error: "Invalid role. Must be admin, user, or viewer" };
        }
        return { valid: true };
      },
    },
    "provision-user": {
      required: ["userId", "services"],
      validate: (params: any) => {
        if (!params.userId) return { valid: false, error: "userId is required" };
        if (!Array.isArray(params.services) || params.services.length === 0) {
          return { valid: false, error: "services must be a non-empty array" };
        }
        return { valid: true };
      },
    },
  };

  const validation = validations[intent];
  if (!validation) {
    return { valid: true, warnings: ["Unknown command type - proceeding with caution"] };
  }

  // Check required parameters
  if (parameters) {
    for (const required of validation.required) {
      if (!parameters[required]) {
        return { valid: false, error: `Missing required parameter: ${required}` };
      }
    }

    // Run custom validation
    return validation.validate(parameters);
  }

  return { valid: false, error: "Parameters are required" };
}

/**
 * Get command documentation
 */
function getCommandDocumentation(intent: string) {
  const docs: Record<string, any> = {
    "create-user": {
      description: "Create a new user account",
      parameters: [
        { name: "email", type: "string", required: true, description: "User email address" },
        { name: "name", type: "string", required: true, description: "User full name" },
        { name: "role", type: "string", required: false, description: "User role (default: user)" },
      ],
      examples: [
        { email: "john@example.com", name: "John Doe", role: "user" },
      ],
      riskLevel: "low",
      requiresApproval: false,
    },
    "assign-role": {
      description: "Assign a role to a user",
      parameters: [
        { name: "userId", type: "number", required: true, description: "User ID" },
        { name: "role", type: "string", required: true, description: "Role to assign (admin/user/viewer)" },
      ],
      examples: [
        { userId: 123, role: "admin" },
      ],
      riskLevel: "high",
      requiresApproval: true,
    },
    "provision-user": {
      description: "Provision user across multiple services",
      parameters: [
        { name: "userId", type: "number", required: true, description: "User ID" },
        { name: "services", type: "array", required: true, description: "Services to provision (Teams, Exchange, etc.)" },
      ],
      examples: [
        { userId: 123, services: ["Teams", "Exchange", "SharePoint"] },
      ],
      riskLevel: "medium",
      requiresApproval: true,
    },
  };

  return docs[intent] || {
    description: "Unknown command",
    parameters: [],
    examples: [],
    riskLevel: "unknown",
    requiresApproval: false,
  };
}
