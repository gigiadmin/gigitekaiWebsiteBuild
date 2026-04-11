import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "technician"]).default("user").notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

// Blog Posts - database-driven content management
export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly identifier
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(), // Markdown content
  category: varchar("category", { length: 100 }).notNull(),
  readTime: varchar("readTime", { length: 50 }).notNull(), // e.g. "8 min read"
  published: boolean("published").default(false).notNull(),
  authorName: varchar("authorName", { length: 255 }).default("GigitekAI Team").notNull(),
  authorTitle: varchar("authorTitle", { length: 255 }), // e.g. "CEO & Founder, GigitekAI"
  authorBio: text("authorBio"),   // short paragraph about the author
  authorAvatar: varchar("authorAvatar", { length: 1000 }), // CDN URL for author headshot
  featuredImage: varchar("featuredImage", { length: 1000 }), // CDN URL
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// Admin credentials table for username/password authentication (bypasses OAuth)
export const adminCredentials = mysqlTable("adminCredentials", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  hashedPassword: varchar("hashedPassword", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "agent", "viewer"]).default("agent").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;
// Contact form submissions table
export const contactSubmissions = mysqlTable("contactSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

// Help Desk Tables
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  category: mysqlEnum("category", ["bug_report", "feature_request", "general_support", "billing"]).default("general_support").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export const ticketReplies = mysqlTable("ticketReplies", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  isStaffReply: int("isStaffReply").default(0).notNull(), // 0 = customer, 1 = staff
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketReply = typeof ticketReplies.$inferSelect;
export type InsertTicketReply = typeof ticketReplies.$inferInsert;

// AI Support Bot - Knowledge Base
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Microsoft 365", "Managed IT", "Troubleshooting", "Pricing", "Onboarding", "Sales"
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").notNull(), // comma-separated for search
  priority: int("priority").default(1).notNull(), // higher = more relevant
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

// AI Support Bot - Chat Sessions
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull().unique(), // UUID for browser session
  visitorName: varchar("visitorName", { length: 255 }),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  visitorCompany: varchar("visitorCompany", { length: 255 }),
  visitorInterest: varchar("visitorInterest", { length: 100 }), // e.g., "Microsoft 365", "Pricing", "Support"
  escalatedToTicketId: int("escalatedToTicketId"), // if escalated to help desk
  status: mysqlEnum("status", ["active", "escalated", "closed"]).default("active").notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

// AI Support Bot - Chat Messages
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON: confidence, sources, escalation_reason, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Lead Capture from Chat
export const chatLeads = mysqlTable("chatLeads", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  interest: varchar("interest", { length: 255 }),
  consentEmail: boolean("consentEmail").default(false).notNull(),
  consentPhone: boolean("consentPhone").default(false).notNull(),
  consentText: boolean("consentText").default(false).notNull(),
  conversationSummary: text("conversationSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatLead = typeof chatLeads.$inferSelect;
export type InsertChatLead = typeof chatLeads.$inferInsert;

// Sentiment Analysis & Intent Detection
export const chatAnalytics = mysqlTable("chatAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  messageId: int("messageId").notNull(), // Reference to chatMessages
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative", "angry"]).default("neutral").notNull(),
  sentimentScore: varchar("sentimentScore", { length: 10 }), // 0.0 to 1.0
  intent: mysqlEnum("intent", ["sales", "support", "billing", "general", "complaint"]).default("general").notNull(),
  intentConfidence: varchar("intentConfidence", { length: 10 }), // 0.0 to 1.0
  routedTo: varchar("routedTo", { length: 255 }), // email address (sales@, support@, billing@)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatAnalytic = typeof chatAnalytics.$inferSelect;
export type InsertChatAnalytic = typeof chatAnalytics.$inferInsert;

// Response Ratings - User Feedback
export const responseRatings = mysqlTable("responseRatings", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  messageId: int("messageId").notNull(), // Reference to chatMessages
  rating: mysqlEnum("rating", ["helpful", "neutral", "unhelpful"]).notNull(),
  feedback: text("feedback"), // Optional user comment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResponseRating = typeof responseRatings.$inferSelect;
export type InsertResponseRating = typeof responseRatings.$inferInsert;

// Conversation Summaries
export const conversationSummaries = mysqlTable("conversationSummaries", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull().unique(),
  summary: text("summary").notNull(), // AI-generated summary
  keyPoints: text("keyPoints"), // JSON array of key points
  suggestedActions: text("suggestedActions"), // JSON array of next steps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConversationSummary = typeof conversationSummaries.$inferSelect;
export type InsertConversationSummary = typeof conversationSummaries.$inferInsert;

// Teams Integration - Message Log
export const teamsIntegration = mysqlTable("teamsIntegration", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  teamsConversationId: varchar("teamsConversationId", { length: 255 }).notNull(),
  teamsUserId: varchar("teamsUserId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "archived", "synced"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamsIntegration = typeof teamsIntegration.$inferSelect;
export type InsertTeamsIntegration = typeof teamsIntegration.$inferInsert;

// Agent Takeover Requests
export const agentTakeoverRequests = mysqlTable("agentTakeoverRequests", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  visitorName: varchar("visitorName", { length: 255 }),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  visitorPhone: varchar("visitorPhone", { length: 50 }),
  reason: text("reason"), // Why they want to talk to an agent
  status: mysqlEnum("status", ["pending", "accepted", "declined", "timeout"]).default("pending").notNull(),
  assignedAdminId: int("assignedAdminId"), // Admin who accepted the request
  ticketId: int("ticketId"), // Link to help desk ticket
  conversationContext: text("conversationContext"), // JSON: summary of chat before handoff
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  closedAt: timestamp("closedAt"),
});

export type AgentTakeoverRequest = typeof agentTakeoverRequests.$inferSelect;
export type InsertAgentTakeoverRequest = typeof agentTakeoverRequests.$inferInsert;

// Real-Time Chat - Admin to User Communication
export const realtimeChatSessions = mysqlTable("realtimeChatSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  adminId: int("adminId"),
  ticketId: int("ticketId"), // Link to help desk ticket
  status: mysqlEnum("status", ["active", "closed", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type RealtimeChatSession = typeof realtimeChatSessions.$inferSelect;
export type InsertRealtimeChatSession = typeof realtimeChatSessions.$inferInsert;

// Relation: Chat sessions to tickets
export const chatSessionsRelations = relations(realtimeChatSessions, ({ one }) => ({
  ticket: one(tickets, {
    fields: [realtimeChatSessions.ticketId],
    references: [tickets.id],
  }),
}));

// Relation: Tickets to chat sessions
export const ticketsRelations = relations(tickets, ({ many }) => ({
  chatSessions: many(realtimeChatSessions),
}));

// Real-Time Chat Messages
export const realtimeChatMessages = mysqlTable("realtimeChatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  senderId: int("senderId").notNull(),
  senderRole: mysqlEnum("senderRole", ["user", "admin"]).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RealtimeChatMessage = typeof realtimeChatMessages.$inferSelect;
export type InsertRealtimeChatMessage = typeof realtimeChatMessages.$inferInsert;

// User Online Status
export const userSessions = mysqlTable("userSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  isOnline: boolean("isOnline").default(false).notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// Customer Invites - Admin invites customers to support portal
export const customerInvites = mysqlTable("customerInvites", {
  id: int("id").autoincrement().primaryKey(),
  inviteToken: varchar("inviteToken", { length: 128 }).notNull().unique(), // Unique token for invite link
  invitedEmail: varchar("invitedEmail", { length: 320 }).notNull(),
  invitedName: varchar("invitedName", { length: 255 }),
  invitedCompany: varchar("invitedCompany", { length: 255 }),
  invitedBy: int("invitedBy").notNull(), // Admin ID who sent invite
  status: mysqlEnum("status", ["pending", "accepted", "expired", "revoked"]).default("pending").notNull(),
  acceptedBy: int("acceptedBy"), // User ID who accepted (after signup)
  expiresAt: timestamp("expiresAt").notNull(), // Invite expires after 30 days
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

export type CustomerInvite = typeof customerInvites.$inferSelect;
export type InsertCustomerInvite = typeof customerInvites.$inferInsert;

// Ticket Feedback - Customer feedback after ticket closure
export const ticketFeedback = mysqlTable("ticketFeedback", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  rating: mysqlEnum("rating", ["1", "2", "3", "4", "5"]).notNull(), // 1-5 star rating
  comment: text("comment"), // Optional feedback comment
  wouldRecommend: boolean("wouldRecommend"), // Would recommend our service?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketFeedback = typeof ticketFeedback.$inferSelect;
export type InsertTicketFeedback = typeof ticketFeedback.$inferInsert;


// Email Digest Preferences - Admin preferences for daily email digest
export const emailDigestPreferences = mysqlTable("emailDigestPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Admin user ID
  enabled: boolean("enabled").default(true).notNull(), // Enable/disable digest
  frequency: mysqlEnum("frequency", ["daily", "weekly", "bi-weekly", "monthly"]).default("daily").notNull(), // Digest frequency
  sendTime: varchar("sendTime", { length: 5 }).default("06:00").notNull(), // Time to send (HH:MM format, UTC)
  includeLeads: boolean("includeLeads").default(true).notNull(), // Include new leads
  includeTickets: boolean("includeTickets").default(true).notNull(), // Include ticket summary
  includeApprovals: boolean("includeApprovals").default(true).notNull(), // Include pending approvals
  lastSentAt: timestamp("lastSentAt"), // Last time digest was sent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailDigestPreferences = typeof emailDigestPreferences.$inferSelect;
export type InsertEmailDigestPreferences = typeof emailDigestPreferences.$inferInsert;

// Email Digest History - Track sent digests
export const emailDigestHistory = mysqlTable("emailDigestHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Admin user ID
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  leadsCount: int("leadsCount").default(0).notNull(),
  ticketsCount: int("ticketsCount").default(0).notNull(),
  approvalsCount: int("approvalsCount").default(0).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"), // Error details if failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailDigestHistory = typeof emailDigestHistory.$inferSelect;
export type InsertEmailDigestHistory = typeof emailDigestHistory.$inferInsert;


// Agent Management - Track agents/technicians and their assignments
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Reference to users table
  status: mysqlEnum("status", ["available", "busy", "offline", "on-break"]).default("offline").notNull(),
  specialization: varchar("specialization", { length: 255 }), // e.g., "Microsoft 365", "Security", "Cloud"
  maxConcurrentTickets: int("maxConcurrentTickets").default(5).notNull(), // Max tickets agent can handle
  currentTicketCount: int("currentTicketCount").default(0).notNull(), // Current active tickets
  averageResolutionTime: int("averageResolutionTime"), // Average time to resolve in minutes
  customerSatisfactionScore: varchar("customerSatisfactionScore", { length: 10 }), // 0-5 rating (stored as string)
  totalTicketsResolved: int("totalTicketsResolved").default(0).notNull(),
  totalChatsHandled: int("totalChatsHandled").default(0).notNull(),
  lastStatusChange: timestamp("lastStatusChange").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// Agent Performance Metrics - Track agent performance over time
export const agentMetrics = mysqlTable("agentMetrics", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(), // Reference to agents table
  date: date("date").notNull(), // Date of metrics
  ticketsHandled: int("ticketsHandled").default(0).notNull(),
  chatsHandled: int("chatsHandled").default(0).notNull(),
  averageResolutionTime: int("averageResolutionTime"), // In minutes
  customerSatisfactionScore: varchar("customerSatisfactionScore", { length: 10 }), // 0-5 rating
  firstContactResolution: int("firstContactResolution").default(0).notNull(), // % of tickets resolved on first contact
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMetrics = typeof agentMetrics.$inferSelect;
export type InsertAgentMetrics = typeof agentMetrics.$inferInsert;

// Agent Assignments - Track which tickets/chats are assigned to which agents
export const agentAssignments = mysqlTable("agentAssignments", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(), // Reference to agents table
  ticketId: int("ticketId"), // Reference to tickets table (optional, for ticket assignments)
  chatSessionId: int("chatSessionId"), // Reference to realtimeChatSessions table (optional, for chat assignments)
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"), // When agent completed the assignment
  status: mysqlEnum("status", ["assigned", "in-progress", "completed", "escalated"]).default("assigned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentAssignment = typeof agentAssignments.$inferSelect;
export type InsertAgentAssignment = typeof agentAssignments.$inferInsert;

// Agent Availability Schedule - Track when agents are available
export const agentSchedules = mysqlTable("agentSchedules", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(), // Reference to agents table
  dayOfWeek: int("dayOfWeek").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM format
  isWorkingDay: boolean("isWorkingDay").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentSchedule = typeof agentSchedules.$inferSelect;
export type InsertAgentSchedule = typeof agentSchedules.$inferInsert;
