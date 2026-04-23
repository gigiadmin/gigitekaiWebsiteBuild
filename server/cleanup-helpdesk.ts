/**
 * Cleanup Script: Delete all test tickets and reset helpdesk metrics
 * Run: pnpm tsx server/cleanup-helpdesk.ts
 */

import { getDb } from "./db";
import {
  tickets,
  ticketReplies,
  ticketNotes,
  ticketActivity,
  ticketFeedback,
  agentAssignments,
  agentMetrics,
  chatSessions,
  chatMessages,
  realtimeChatSessions,
  realtimeChatMessages,
} from "../drizzle/schema";

async function cleanupHelpdesk() {
  console.log("🧹 Starting helpdesk cleanup...\n");

  try {
    const db = await getDb();

    // 1. Count before cleanup
    const ticketCountBefore = await db.select().from(tickets);
    const repliesCountBefore = await db.select().from(ticketReplies);
    const notesCountBefore = await db.select().from(ticketNotes);
    const activityCountBefore = await db.select().from(ticketActivity);
    const feedbackCountBefore = await db.select().from(ticketFeedback);
    const assignmentCountBefore = await db.select().from(agentAssignments);
    const metricsCountBefore = await db.select().from(agentMetrics);
    const chatSessionsCountBefore = await db.select().from(chatSessions);
    const chatMessagesCountBefore = await db.select().from(chatMessages);
    const realtimeChatSessionsCountBefore = await db.select().from(realtimeChatSessions);
    const realtimeChatMessagesCountBefore = await db.select().from(realtimeChatMessages);

    console.log("📊 Before Cleanup:");
    console.log(`  - Total Tickets: ${ticketCountBefore.length}`);
    console.log(`  - Total Ticket Replies: ${repliesCountBefore.length}`);
    console.log(`  - Total Ticket Notes: ${notesCountBefore.length}`);
    console.log(`  - Total Ticket Activity: ${activityCountBefore.length}`);
    console.log(`  - Total Ticket Feedback: ${feedbackCountBefore.length}`);
    console.log(`  - Total Agent Assignments: ${assignmentCountBefore.length}`);
    console.log(`  - Total Agent Metrics: ${metricsCountBefore.length}`);
    console.log(`  - Total Chat Sessions: ${chatSessionsCountBefore.length}`);
    console.log(`  - Total Chat Messages: ${chatMessagesCountBefore.length}`);
    console.log(`  - Total Realtime Chat Sessions: ${realtimeChatSessionsCountBefore.length}`);
    console.log(`  - Total Realtime Chat Messages: ${realtimeChatMessagesCountBefore.length}\n`);

    // 2. Delete all ticket-related data (cascade will handle some, but we'll be explicit)
    console.log("🗑️  Deleting test data...");

    // Delete ticket feedback first (references tickets)
    const deletedFeedback = await db.delete(ticketFeedback).execute();
    console.log(`  ✓ Deleted ${deletedFeedback.affectedRows} ticket feedback`);

    // Delete ticket activity (references tickets)
    const deletedActivity = await db.delete(ticketActivity).execute();
    console.log(`  ✓ Deleted ${deletedActivity.affectedRows} ticket activity records`);

    // Delete ticket notes (references tickets)
    const deletedNotes = await db.delete(ticketNotes).execute();
    console.log(`  ✓ Deleted ${deletedNotes.affectedRows} ticket notes`);

    // Delete ticket replies (references tickets)
    const deletedReplies = await db.delete(ticketReplies).execute();
    console.log(`  ✓ Deleted ${deletedReplies.affectedRows} ticket replies`);

    // Delete agent assignments (references tickets)
    const deletedAssignments = await db.delete(agentAssignments).execute();
    console.log(`  ✓ Deleted ${deletedAssignments.affectedRows} agent assignments`);

    // Delete chat messages first (references chat sessions)
    const deletedChatMessages = await db.delete(chatMessages).execute();
    console.log(`  ✓ Deleted ${deletedChatMessages.affectedRows} chat messages`);

    // Delete chat sessions
    const deletedChatSessions = await db.delete(chatSessions).execute();
    console.log(`  ✓ Deleted ${deletedChatSessions.affectedRows} chat sessions`);

    // Delete realtime chat messages
    const deletedRealtimeChatMessages = await db.delete(realtimeChatMessages).execute();
    console.log(`  ✓ Deleted ${deletedRealtimeChatMessages.affectedRows} realtime chat messages`);

    // Delete realtime chat sessions
    const deletedRealtimeChatSessions = await db.delete(realtimeChatSessions).execute();
    console.log(`  ✓ Deleted ${deletedRealtimeChatSessions.affectedRows} realtime chat sessions`);

    // Delete all tickets
    const deletedTickets = await db.delete(tickets).execute();
    console.log(`  ✓ Deleted ${deletedTickets.affectedRows} tickets\n`);

    // 3. Reset metrics
    console.log("📈 Resetting metrics...");
    const deletedMetrics = await db.delete(agentMetrics).execute();
    console.log(`  ✓ Deleted ${deletedMetrics.affectedRows} agent metrics records\n`);

    // 4. Verify cleanup
    const ticketCountAfter = await db.select().from(tickets);
    const repliesCountAfter = await db.select().from(ticketReplies);
    const notesCountAfter = await db.select().from(ticketNotes);
    const activityCountAfter = await db.select().from(ticketActivity);
    const feedbackCountAfter = await db.select().from(ticketFeedback);
    const assignmentCountAfter = await db.select().from(agentAssignments);
    const metricsCountAfter = await db.select().from(agentMetrics);
    const chatSessionsCountAfter = await db.select().from(chatSessions);
    const chatMessagesCountAfter = await db.select().from(chatMessages);
    const realtimeChatSessionsCountAfter = await db.select().from(realtimeChatSessions);
    const realtimeChatMessagesCountAfter = await db.select().from(realtimeChatMessages);

    console.log("✅ After Cleanup:");
    console.log(`  - Total Tickets: ${ticketCountAfter.length}`);
    console.log(`  - Total Ticket Replies: ${repliesCountAfter.length}`);
    console.log(`  - Total Ticket Notes: ${notesCountAfter.length}`);
    console.log(`  - Total Ticket Activity: ${activityCountAfter.length}`);
    console.log(`  - Total Ticket Feedback: ${feedbackCountAfter.length}`);
    console.log(`  - Total Agent Assignments: ${assignmentCountAfter.length}`);
    console.log(`  - Total Agent Metrics: ${metricsCountAfter.length}`);
    console.log(`  - Total Chat Sessions: ${chatSessionsCountAfter.length}`);
    console.log(`  - Total Chat Messages: ${chatMessagesCountAfter.length}`);
    console.log(`  - Total Realtime Chat Sessions: ${realtimeChatSessionsCountAfter.length}`);
    console.log(`  - Total Realtime Chat Messages: ${realtimeChatMessagesCountAfter.length}\n`);

    console.log("🎉 Helpdesk cleanup complete! Ready for production release.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

cleanupHelpdesk();
