import { getDb } from "./db";
import { workflowExecutions, workflowTemplates } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Save workflow execution to database
 */
export async function saveWorkflowExecution(data: {
  workflowId: string;
  workflowName: string;
  initiatedBy: number;
  parameters: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  steps?: Array<{ system: string; status: string; progress: number; details?: string }>;
  result?: Record<string, any>;
  errorMessage?: string;
  duration?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db.insert(workflowExecutions).values({
    workflowId: data.workflowId,
    workflowName: data.workflowName,
    initiatedBy: data.initiatedBy,
    parameters: data.parameters,
    status: data.status,
    steps: data.steps || null,
    result: data.result || null,
    errorMessage: data.errorMessage || null,
    duration: data.duration || null,
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return result;
}

/**
 * Update workflow execution status
 */
export async function updateWorkflowExecution(
  id: number,
  data: {
    status?: "pending" | "running" | "completed" | "failed" | "cancelled";
    steps?: Array<{ system: string; status: string; progress: number; details?: string }>;
    result?: Record<string, any>;
    errorMessage?: string;
    duration?: number;
  }
) {
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };
  if (data.status) updateData.status = data.status;
  if (data.steps) updateData.steps = data.steps;
  if (data.result) updateData.result = data.result;
  if (data.errorMessage) updateData.errorMessage = data.errorMessage;
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.status === "completed" || data.status === "failed") {
    updateData.completedAt = new Date().toISOString();
  }

  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(workflowExecutions).set(updateData).where(eq(workflowExecutions.id, id));
}

/**
 * Get recent workflow executions
 */
export async function getRecentWorkflowExecutions(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(workflowExecutions)
    .orderBy(desc(workflowExecutions.createdAt))
    .limit(limit);
}

/**
 * Get workflow execution by ID
 */
export async function getWorkflowExecution(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db
    .select()
    .from(workflowExecutions)
    .where(eq(workflowExecutions.id, id));
  return result;
}

/**
 * Create workflow template
 */
export async function createWorkflowTemplate(data: {
  name: string;
  description?: string;
  category: string;
  steps: Array<{ name: string; system: string; action: string; params?: Record<string, any> }>;
  parameters: Array<{ name: string; type: string; required: boolean; description?: string }>;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db.insert(workflowTemplates).values({
    name: data.name,
    description: data.description || null,
    category: data.category,
    steps: data.steps,
    parameters: data.parameters,
    createdBy: data.createdBy,
    isActive: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return result;
}

/**
 * Get workflow templates by category
 */
export async function getWorkflowTemplatesByCategory(category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.category, category))
    .orderBy(desc(workflowTemplates.createdAt));
}

/**
 * Get all active workflow templates
 */
export async function getActiveWorkflowTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.isActive, 1))
    .orderBy(desc(workflowTemplates.createdAt));
}
