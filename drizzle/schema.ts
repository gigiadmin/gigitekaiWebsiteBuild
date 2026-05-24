import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum, json, date, decimal } from "drizzle-orm/mysql-core";
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
  /** Soft-delete timestamp. When set, the account is in the 30-day recycle bin. */
  deletedAt: timestamp("deletedAt"),
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
  phone: varchar("phone", { length: 20 }), // E.164 format: +1234567890
  company: varchar("company", { length: 255 }),
  message: text("message").notNull(),
  hearAboutUs: varchar("hearAboutUs", { length: 100 }), // How did you hear about us?
  fileKey: varchar("fileKey", { length: 255 }), // S3 key for uploaded file
  fileName: varchar("fileName", { length: 255 }), // Original filename
  fileSize: int("fileSize"), // File size in bytes
  fileMimeType: varchar("fileMimeType", { length: 100 }), // MIME type (pdf, doc, xls, etc)
  fileUrl: text("fileUrl"), // Presigned S3 URL for download
  pricingTier: varchar("pricingTier", { length: 50 }), // Pricing tier: starter, professional, enterprise
  companySize: varchar("companySize", { length: 50 }), // Company size: 1-10, 11-50, 51-200, 200+
  subject: varchar("subject", { length: 255 }), // Email subject line
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
  stepsAttempted: text("stepsAttempted"), // Customer's troubleshooting steps
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  category: mysqlEnum("category", ["bug_report", "feature_request", "general_support", "billing", "email", "printer", "internet", "network", "other"]).default("general_support").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "on_hold", "resolved", "closed"]).default("open").notNull(),
  assignedTo: int("assignedTo"), // userId of assigned agent
  // AI Triage fields
  aiCategory: varchar("aiCategory", { length: 100 }), // LLM-suggested category
  aiPriority: varchar("aiPriority", { length: 20 }), // LLM-suggested priority
  aiConfidence: decimal("aiConfidence", { precision: 4, scale: 2 }), // 0.00-1.00
  aiReasoning: text("aiReasoning"), // LLM explanation
  source: varchar("source", { length: 50 }).default("web").notNull(), // 'web' | 'email' | 'chat' | 'phone'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  closingNotes: text("closingNotes"), // Required when closing a ticket
  closedAt: timestamp("closedAt"),
  mergedInto: int("mergedInto"), // ticketId of the ticket this was merged into (null if not merged)
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

// Internal staff notes on tickets (not visible to customers)
export const ticketNotes = mysqlTable("ticketNotes", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  authorId: int("authorId").notNull(), // userId of staff member
  authorName: varchar("authorName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketNote = typeof ticketNotes.$inferSelect;
export type InsertTicketNote = typeof ticketNotes.$inferInsert;

// Ticket activity/audit log
export const ticketActivity = mysqlTable("ticketActivity", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  actorId: int("actorId").notNull(), // userId who performed the action
  actorName: varchar("actorName", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "status_changed", "note_added", "assigned"
  fromValue: varchar("fromValue", { length: 255 }), // previous value
  toValue: varchar("toValue", { length: 255 }), // new value
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketActivityEntry = typeof ticketActivity.$inferSelect;
export type InsertTicketActivity = typeof ticketActivity.$inferInsert;

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
  expiresAt: timestamp("expiresAt").notNull(), // Invite expires after 72 hours
  reminderSent: boolean("reminderSent").default(false).notNull(), // Whether expiration reminder was sent
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

// Newsletter Subscribers — public email capture from blog pages
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Random token used for one-click unsubscribe links */
  unsubscribeToken: varchar("unsubscribeToken", { length: 64 }).notNull().unique(),
  /** Source page where the user signed up (e.g. "/blog", "/blog/some-slug") */
  source: varchar("source", { length: 500 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// Newsletter Campaigns — broadcast history log
export const newsletterCampaigns = mysqlTable("newsletterCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 500 }).notNull(),
  /** HTML body of the campaign email */
  body: text("body").notNull(),
  /** Total active subscribers at time of send */
  recipientCount: int("recipientCount").default(0).notNull(),
  /** How many emails were sent successfully */
  sentCount: int("sentCount").default(0).notNull(),
  /** How many emails failed */
  failedCount: int("failedCount").default(0).notNull(),
  /** 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' */
  status: varchar("status", { length: 50 }).default("completed").notNull(),
  sentBy: varchar("sentBy", { length: 255 }),  // admin name/email
  /** UTC timestamp for when a scheduled campaign should be sent */
  scheduledAt: timestamp("scheduledAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type InsertNewsletterCampaign = typeof newsletterCampaigns.$inferInsert;

// Admin Notifications — real-time alert log for the admin portal
export const adminNotifications = mysqlTable("adminNotifications", {
  id: int("id").autoincrement().primaryKey(),
  /** 'new_ticket' | 'new_chat' | 'ticket_reply' | 'chat_message' */
  type: varchar("type", { length: 50 }).notNull(),
  /** Short headline shown in the bell dropdown */
  title: varchar("title", { length: 255 }).notNull(),
  /** Optional longer description */
  body: text("body"),
  /** Link the admin should navigate to when clicking the notification */
  href: varchar("href", { length: 500 }),
  /** Priority: 'critical' | 'high' | 'normal' */
  priority: varchar("priority", { length: 20 }).default("normal").notNull(),
  /** Whether the notification has been read by an admin */
  isRead: boolean("isRead").default(false).notNull(),
  /** Optional reference to a ticket id */
  ticketId: int("ticketId"),
  /** Optional reference to a chat session id */
  sessionId: int("sessionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

// Email Templates — pre-built templates for common support responses
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template name (e.g., "Ticket Response", "Follow-up", "Resolution") */
  name: varchar("name", { length: 255 }).notNull(),
  /** Email subject template (can include {{variables}}) */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Email body template (can include {{variables}}) */
  body: text("body").notNull(),
  /** Category: 'ticket_response' | 'follow_up' | 'resolution' | 'general' */
  category: varchar("category", { length: 50 }).notNull(),
  /** Admin who created this template (null = system template) */
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// Email Messages — sent and received emails from support@gigitekai.com
export const emailMessages = mysqlTable("emailMessages", {
  id: int("id").autoincrement().primaryKey(),
  /** 'sent' | 'received' */
  direction: varchar("direction", { length: 20 }).notNull(),
  /** Sender email address */
  from: varchar("from", { length: 255 }).notNull(),
  /** Recipient email address(es) — comma-separated for multiple */
  to: varchar("to", { length: 1000 }).notNull(),
  /** Email subject */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Email body (HTML) */
  body: text("body").notNull(),
  /** Optional reference to emailTemplates.id if sent from template */
  templateId: int("templateId"),
  /** Optional reference to tickets.id if linked to a ticket */
  linkedTicketId: int("linkedTicketId"),
  /** Optional reference to realtimeChatSessions.id if linked to a chat */
  linkedSessionId: int("linkedSessionId"),
  /** 'draft' | 'sent' | 'failed' | 'received' */
  status: varchar("status", { length: 20 }).default("sent").notNull(),
  /** SendGrid Message-ID for tracking (if sent via SendGrid) */
  messageId: varchar("messageId", { length: 255 }),
  /** Admin who sent this email (null = system/webhook) */
  sentBy: int("sentBy"),
  /** When the email was sent or received */
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = typeof emailMessages.$inferInsert;


// Email Recipient Groups — manage groups of recipients for targeted email campaigns
export const emailRecipientGroups = mysqlTable("emailRecipientGroups", {
  id: int("id").autoincrement().primaryKey(),
  /** Group name (e.g., "Newsletter Subscribers", "VIP Customers") */
  name: varchar("name", { length: 255 }).notNull(),
  /** Group description */
  description: text("description"),
  /** Group type: 'newsletter_subscribers' | 'customers' | 'custom' */
  type: varchar("type", { length: 50 }).notNull(),
  /** Admin who created this group */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailRecipientGroup = typeof emailRecipientGroups.$inferSelect;
export type InsertEmailRecipientGroup = typeof emailRecipientGroups.$inferInsert;

// Email Group Members — email addresses in each recipient group
export const emailGroupMembers = mysqlTable("emailGroupMembers", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to emailRecipientGroups.id */
  groupId: int("groupId").notNull(),
  /** Email address of the group member */
  email: varchar("email", { length: 255 }).notNull(),
  /** Optional name of the recipient */
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailGroupMember = typeof emailGroupMembers.$inferSelect;
export type InsertEmailGroupMember = typeof emailGroupMembers.$inferInsert;

// Ticket Templates — pre-built responses for common issues
export const ticketTemplates = mysqlTable("ticketTemplates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template name (e.g., "Password Reset", "License Renewal") */
  name: varchar("name", { length: 255 }).notNull(),
  /** Template subject line */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Template body/content */
  body: text("body").notNull(),
  /** Category (e.g., "General Support", "Billing", "Technical") */
  category: varchar("category", { length: 100 }).notNull(),
  /** Admin who created this template */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TicketTemplate = typeof ticketTemplates.$inferSelect;
export type InsertTicketTemplate = typeof ticketTemplates.$inferInsert;


// Push Notifications — store push subscription endpoints for Web Push API
export const pushNotifications = mysqlTable("pushNotifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to users.id */
  userId: int("userId").notNull(),
  /** Web Push API endpoint URL */
  endpoint: text("endpoint").notNull(),
  /** Push subscription auth key (base64) */
  auth: varchar("auth", { length: 255 }).notNull(),
  /** Push subscription p256dh key (base64) */
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  /** Whether this subscription is still active */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertPushNotification = typeof pushNotifications.$inferInsert;


// User Activity Tracking - track logins and user interactions
export const userActivity = mysqlTable("userActivity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: varchar("activityType", { length: 50 }).notNull(), // "login", "logout", "ticket_created", "chat_started", etc.
  description: text("description"), // Additional details about the activity
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client info
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

// Customer Feedback & Ratings - track customer satisfaction
export const customerFeedback = mysqlTable("customerFeedback", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: int("rating").notNull(), // 1-5 star rating
  comment: text("comment"), // Customer feedback text
  categories: varchar("categories", { length: 500 }), // JSON array of feedback categories
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = typeof customerFeedback.$inferInsert;

// Website Traffic Analytics - store traffic data
export const websiteTraffic = mysqlTable("websiteTraffic", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull(),
  pageUrl: varchar("pageUrl", { length: 500 }).notNull(),
  pageTitle: varchar("pageTitle", { length: 500 }),
  visitors: int("visitors").default(0).notNull(),
  pageViews: int("pageViews").default(0).notNull(),
  bounceRate: decimal("bounceRate", { precision: 5, scale: 2 }).default("0"), // percentage
  avgTimeOnPage: int("avgTimeOnPage").default(0), // seconds
  referrer: varchar("referrer", { length: 500 }), // traffic source
  country: varchar("country", { length: 100 }), // visitor location
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WebsiteTraffic = typeof websiteTraffic.$inferSelect;
export type InsertWebsiteTraffic = typeof websiteTraffic.$inferInsert;


// ── Lead Generation Features ──────────────────────────────────────────────────

/**
 * Cybersecurity Risk Assessment - Stores quiz responses and scores
 */
export const securityAssessments = mysqlTable("securityAssessments", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  // Quiz responses (0-10 scale for each category)
  emailSecurityScore: int("emailSecurityScore").notNull(), // 0-10
  endpointProtectionScore: int("endpointProtectionScore").notNull(), // 0-10
  backupRecoveryScore: int("backupRecoveryScore").notNull(), // 0-10
  identityManagementScore: int("identityManagementScore").notNull(), // 0-10
  complianceScore: int("complianceScore").notNull(), // 0-10
  overallScore: int("overallScore").notNull(), // 0-50 total
  riskLevel: varchar("riskLevel", { length: 20 }).notNull(), // "critical", "high", "medium", "low"
  pdfGenerated: boolean("pdfGenerated").default(false),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  leadCaptured: boolean("leadCaptured").default(true),
  emailSent: boolean("emailSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow().notNull(),
});
export type SecurityAssessment = typeof securityAssessments.$inferSelect;
export type InsertSecurityAssessment = typeof securityAssessments.$inferInsert;

/**
 * Exit Intent Popup - Tracks popup interactions and conversions
 */
export const exitIntentPopups = mysqlTable("exitIntentPopups", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }),
  leadMagnetDownloaded: varchar("leadMagnetDownloaded", { length: 255 }), // which guide they downloaded
  downloadUrl: varchar("downloadUrl", { length: 500 }),
  pageUrl: varchar("pageUrl", { length: 500 }).notNull(), // which page they were on
  emailSent: boolean("emailSent").default(false),
  leadCaptured: boolean("leadCaptured").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ExitIntentPopup = typeof exitIntentPopups.$inferSelect;
export type InsertExitIntentPopup = typeof exitIntentPopups.$inferInsert;

/**
 * Multi-Step Contact Form - Tracks multi-step form submissions
 */
export const multiStepFormSubmissions = mysqlTable("multiStepFormSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  employeeCount: varchar("employeeCount", { length: 50 }), // "1-10", "11-50", "51-100", "100+"
  currentITSetup: varchar("currentITSetup", { length: 500 }), // description of current setup
  // Step 1: What do you need help with?
  needsCybersecurity: boolean("needsCybersecurity").default(false),
  needsCloud: boolean("needsCloud").default(false),
  needsHelpdesk: boolean("needsHelpdesk").default(false),
  needsAI: boolean("needsAI").default(false),
  otherNeeds: varchar("otherNeeds", { length: 500 }),
  // File upload fields
  fileKey: varchar("fileKey", { length: 255 }), // S3 key for uploaded file
  fileName: varchar("fileName", { length: 255 }), // Original filename
  fileSize: int("fileSize"), // File size in bytes
  fileMimeType: varchar("fileMimeType", { length: 100 }), // MIME type
  fileUrl: text("fileUrl"), // Presigned S3 URL for download
  // Metadata
  formCompletedAt: timestamp("formCompletedAt"),
  leadQuality: varchar("leadQuality", { length: 20 }), // "hot", "warm", "cold"
  assignedTo: int("assignedTo"), // user ID of assigned sales rep
  status: varchar("status", { length: 20 }).default("new"), // "new", "contacted", "qualified", "converted", "rejected"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow().notNull(),
});
export type MultiStepFormSubmission = typeof multiStepFormSubmissions.$inferSelect;
export type InsertMultiStepFormSubmission = typeof multiStepFormSubmissions.$inferInsert;

/**
 * Lead Generation Analytics - Tracks overall lead gen performance
 */
export const leadGenAnalytics = mysqlTable("leadGenAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull(),
  assessmentLeads: int("assessmentLeads").default(0), // from security assessment
  popupLeads: int("popupLeads").default(0), // from exit intent
  formLeads: int("formLeads").default(0), // from multi-step form
  totalLeads: int("totalLeads").default(0),
  assessmentConversions: int("assessmentConversions").default(0), // leads who booked call
  popupConversions: int("popupConversions").default(0),
  formConversions: int("formConversions").default(0),
  totalConversions: int("totalConversions").default(0),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default("0"), // percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeadGenAnalytics = typeof leadGenAnalytics.$inferSelect;
export type InsertLeadGenAnalytics = typeof leadGenAnalytics.$inferInsert;

// Meeting Bookings — tracks all scheduled strategy calls for cancel/reschedule
export const meetingBookings = mysqlTable("meetingBookings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  meetingDate: varchar("meetingDate", { length: 10 }).notNull(), // YYYY-MM-DD
  meetingTime: varchar("meetingTime", { length: 5 }).notNull(),  // HH:MM
  notes: text("notes"),
  status: mysqlEnum("status", ["confirmed", "cancelled", "rescheduled"]).default("confirmed").notNull(),
  cancelToken: varchar("cancelToken", { length: 64 }).unique(), // unique token for cancel/reschedule link
  m365EventId: varchar("m365EventId", { length: 500 }), // Microsoft Graph event ID for deletion
  cancelledAt: timestamp("cancelledAt"),
  rescheduledTo: int("rescheduledTo"), // references another meetingBookings.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MeetingBooking = typeof meetingBookings.$inferSelect;
export type InsertMeetingBooking = typeof meetingBookings.$inferInsert;

// SLA Snooze — allows agents to temporarily dismiss SLA breach alerts for a ticket
export const slaSnoozes = mysqlTable("slaSnoozes", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  snoozedUntil: timestamp("snoozedUntil").notNull(),
  snoozedBy: int("snoozedBy").notNull(), // userId of the agent who snoozed
  reason: varchar("reason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SlaSnooze = typeof slaSnoozes.$inferSelect;
export type InsertSlaSnooze = typeof slaSnoozes.$inferInsert;

// Knowledge Base Articles — admin-managed articles surfaced in AI chatbot and agent reply suggestions
export const kbArticles = mysqlTable("kbArticles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(), // Markdown
  category: varchar("category", { length: 100 }).notNull().default("general"),
  tags: varchar("tags", { length: 500 }), // comma-separated
  isPublished: boolean("isPublished").default(false).notNull(),
  createdBy: int("createdBy"), // userId
  // External sync fields (MS Learn, etc.)
  sourceUrl: varchar("sourceUrl", { length: 1000 }), // Original URL (e.g. MS Learn module URL)
  externalUid: varchar("externalUid", { length: 500 }), // External unique ID for dedup (e.g. MS Learn UID)
  syncSource: varchar("syncSource", { length: 100 }), // 'ms-learn' | 'manual'
  lastSyncedAt: timestamp("lastSyncedAt"), // When this article was last synced from external source
  // User-focused metadata fields
  subcategory: varchar("subcategory", { length: 150 }), // More specific classification
  audience: mysqlEnum("audience", ["end-user", "technician", "admin"]).default("technician"), // Who this article targets
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate"), // Complexity level
  estimatedResolutionTime: varchar("estimatedResolutionTime", { length: 50 }), // e.g. '5-10 minutes'
  ariaEnabled: boolean("ariaEnabled").default(true).notNull(), // Whether ARIA can suggest this article
  articleCode: varchar("articleCode", { length: 20 }), // e.g. USR-101, WIN-001, SPO-076
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KbArticle = typeof kbArticles.$inferSelect;
export type InsertKbArticle = typeof kbArticles.$inferInsert;

// KB Article Versions - track edit history for rollback capability
export const kbArticleVersions = mysqlTable("kbArticleVersions", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull().references(() => kbArticles.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: varchar("tags", { length: 500 }),
  editedBy: int("editedBy"), // userId who made the edit
  changeDescription: varchar("changeDescription", { length: 500 }), // What changed in this version
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KbArticleVersion = typeof kbArticleVersions.$inferSelect;
export type InsertKbArticleVersion = typeof kbArticleVersions.$inferInsert;

// KB Article Tags - normalized tags for better search and filtering
export const kbArticleTags = mysqlTable("kbArticleTags", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull().references(() => kbArticles.id, { onDelete: "cascade" }),
  tag: varchar("tag", { length: 100 }).notNull(),
  source: varchar("source", { length: 50 }).notNull().default("manual"), // 'manual' | 'auto_llm' | 'auto_search'
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"), // 0.00-1.00 for LLM-generated tags
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KbArticleTag = typeof kbArticleTags.$inferSelect;
export type InsertKbArticleTag = typeof kbArticleTags.$inferInsert;

// Canned Responses — pre-written reply templates for agents
export const cannedResponses = mysqlTable("cannedResponses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("general"),
  usageCount: int("usageCount").default(0).notNull(),
  createdBy: int("createdBy"), // userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CannedResponse = typeof cannedResponses.$inferSelect;
export type InsertCannedResponse = typeof cannedResponses.$inferInsert;

// Push Subscriptions — Web Push API subscriptions for proactive notifications
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Social Posts — history of posts published to social media platforms
export const socialPosts = mysqlTable("socialPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  platform: mysqlEnum("platform", ["linkedin", "twitter", "facebook"]).notNull(),
  postId: varchar("postId", { length: 500 }), // platform-assigned post ID
  content: text("content").notNull(), // the actual text posted
  url: varchar("url", { length: 1000 }), // link to the live post
  status: mysqlEnum("status", ["published", "failed", "pending", "scheduled", "draft"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  publishedAt: timestamp("publishedAt"),
  scheduledAt: timestamp("scheduledAt"),                 // null = immediate, set = scheduled
  platforms: text("platforms"),                          // JSON array e.g. ["linkedin","twitter"]
  link: varchar("link", { length: 1000 }),               // optional link attached to post
  engagementLikes: int("engagementLikes").default(0),
  engagementComments: int("engagementComments").default(0),
  engagementShares: int("engagementShares").default(0),
  engagementLastFetched: timestamp("engagementLastFetched"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

// Social platform OAuth connections — stores tokens obtained via OAuth flows
export const socialConnections = mysqlTable("socialConnections", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["linkedin", "twitter", "facebook"]).notNull().unique(),
  accessToken: text("accessToken").notNull(),
  accessTokenSecret: text("accessTokenSecret"), // Twitter OAuth 1.0a only
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  pageId: varchar("pageId", { length: 255 }), // Facebook page ID
  personUrn: varchar("personUrn", { length: 255 }), // LinkedIn person URN
  screenName: varchar("screenName", { length: 255 }), // display name / handle
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SocialConnection = typeof socialConnections.$inferSelect;
export type InsertSocialConnection = typeof socialConnections.$inferInsert;

// KB Article Feedback — user ratings and feedback on suggested KB articles
export const kbArticleFeedback = mysqlTable("kbArticleFeedback", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(), // chatMessages.id - the bot message that suggested the KB article
  articleId: int("articleId").notNull(), // kbArticles.id - the KB article that was suggested
  rating: mysqlEnum("rating", ["helpful", "unhelpful"]).notNull(), // thumbs-up or thumbs-down
  feedbackMessage: text("feedbackMessage"), // optional: what was missing or why it wasn't helpful
  sessionId: varchar("sessionId", { length: 64 }), // chat session ID for context
  userId: int("userId"), // user ID if authenticated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KbArticleFeedback = typeof kbArticleFeedback.$inferSelect;
export type InsertKbArticleFeedback = typeof kbArticleFeedback.$inferInsert;


// Pricing Tiers — helpdesk service tiers and pricing
export const pricingTiers = mysqlTable("pricingTiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // "Starter", "Pro", "Enterprise"
  description: text("description"),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal("annualPrice", { precision: 10, scale: 2 }).notNull(),
  isPopular: boolean("isPopular").default(false).notNull(),
  features: text("features").notNull(), // JSON array of feature strings
  maxUsers: int("maxUsers"), // max team members
  maxTickets: int("maxTickets"), // max tickets per month
  maxStorage: int("maxStorage"), // in GB
  supportLevel: varchar("supportLevel", { length: 50 }), // "Basic", "Priority", "24/7"
  slaResponse: varchar("slaResponse", { length: 50 }), // e.g. "4 hours", "1 hour"
  slaResolution: varchar("slaResolution", { length: 50 }), // e.g. "48 hours", "24 hours"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = typeof pricingTiers.$inferInsert;

// ROI Calculations — user ROI calculator submissions
export const roiCalculations = mysqlTable("roiCalculations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null if anonymous
  tierName: varchar("tierName", { length: 255 }),
  currentEmployees: int("currentEmployees").notNull(),
  ticketsPerMonth: int("ticketsPerMonth").notNull(),
  avgResolutionTime: decimal("avgResolutionTime", { precision: 5, scale: 2 }).notNull(), // hours
  costPerHour: decimal("costPerHour", { precision: 10, scale: 2 }).notNull(),
  estimatedSavings: decimal("estimatedSavings", { precision: 12, scale: 2 }).notNull(), // annual
  paybackPeriod: decimal("paybackPeriod", { precision: 5, scale: 2 }), // months
  roiPercentage: decimal("roiPercentage", { precision: 10, scale: 2 }), // %
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RoiCalculation = typeof roiCalculations.$inferSelect;
export type InsertRoiCalculation = typeof roiCalculations.$inferInsert;

// Pricing Analytics — track pricing page engagement
export const pricingAnalytics = mysqlTable("pricingAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  pageViews: int("pageViews").default(0).notNull(),
  tierViews: text("tierViews"), // JSON object with tier view counts
  calculatorUsed: int("calculatorUsed").default(0).notNull(),
  contactFormSubmitted: int("contactFormSubmitted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PricingAnalytics = typeof pricingAnalytics.$inferSelect;
export type InsertPricingAnalytics = typeof pricingAnalytics.$inferInsert;


// SLA Configuration — defines SLA rules for different ticket categories and priorities
export const slaConfigurations = mysqlTable("slaConfigurations", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  responseTimeMinutes: int("responseTimeMinutes").notNull(), // time to first response
  resolutionTimeMinutes: int("resolutionTimeMinutes").notNull(), // time to resolution
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SlaConfiguration = typeof slaConfigurations.$inferSelect;
export type InsertSlaConfiguration = typeof slaConfigurations.$inferInsert;

// SLA Tracking — tracks SLA metrics for each ticket
export const slaTracking = mysqlTable("slaTracking", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().unique(),
  responseDeadline: timestamp("responseDeadline").notNull(),
  resolutionDeadline: timestamp("resolutionDeadline").notNull(),
  responseBreached: boolean("responseBreached").default(false).notNull(),
  resolutionBreached: boolean("resolutionBreached").default(false).notNull(),
  firstResponseAt: timestamp("firstResponseAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SlaTracking = typeof slaTracking.$inferSelect;
export type InsertSlaTracking = typeof slaTracking.$inferInsert;

// Ticket Merge History — tracks when tickets are merged together
export const ticketMerges = mysqlTable("ticketMerges", {
  id: int("id").autoincrement().primaryKey(),
  primaryTicketId: int("primaryTicketId").notNull(), // the ticket that remains
  mergedTicketId: int("mergedTicketId").notNull(), // the ticket that was merged into primary
  mergedBy: int("mergedBy").notNull(), // userId of agent who performed merge
  reason: text("reason"), // why tickets were merged
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TicketMerge = typeof ticketMerges.$inferSelect;
export type InsertTicketMerge = typeof ticketMerges.$inferInsert;

// Agent Workload — tracks agent ticket assignments and workload
export const agentWorkload = mysqlTable("agentWorkload", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  assignedTickets: int("assignedTickets").default(0).notNull(),
  completedTickets: int("completedTickets").default(0).notNull(),
  avgResolutionTime: decimal("avgResolutionTime", { precision: 8, scale: 2 }), // minutes
  slaBreaches: int("slaBreaches").default(0).notNull(),
  customerSatisfaction: decimal("customerSatisfaction", { precision: 3, scale: 2 }), // 0-5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AgentWorkload = typeof agentWorkload.$inferSelect;
export type InsertAgentWorkload = typeof agentWorkload.$inferInsert;

// Bulk Ticket Actions — tracks bulk operations performed on tickets
export const bulkTicketActions = mysqlTable("bulkTicketActions", {
  id: int("id").autoincrement().primaryKey(),
  actionType: varchar("actionType", { length: 50 }).notNull(), // 'close', 'assign', 'prioritize', 'tag'
  ticketIds: text("ticketIds").notNull(), // JSON array of ticket IDs
  assignedTo: int("assignedTo"), // for assign action
  newPriority: varchar("newPriority", { length: 20 }), // for prioritize action
  newStatus: varchar("newStatus", { length: 20 }), // for status change action
  performedBy: int("performedBy").notNull(), // userId of agent
  affectedCount: int("affectedCount").notNull(), // number of tickets affected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BulkTicketAction = typeof bulkTicketActions.$inferSelect;
export type InsertBulkTicketAction = typeof bulkTicketActions.$inferInsert;


// Ticket Surveys — customer satisfaction surveys for closed tickets
export const ticketSurveys = mysqlTable("ticketSurveys", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().unique(), // one survey per ticket
  rating: int("rating").notNull(), // 1-5 star rating
  comment: text("comment"), // optional customer feedback
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  submittedBy: int("submittedBy"), // userId of customer who submitted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TicketSurvey = typeof ticketSurveys.$inferSelect;
export type InsertTicketSurvey = typeof ticketSurveys.$inferInsert;


// KB Article Analytics — track views, shares, and effectiveness
export const kbArticleAnalytics = mysqlTable("kbArticleAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  views: int("views").default(0).notNull(), // total views
  shares: int("shares").default(0).notNull(), // total shares
  ticketsResolved: int("ticketsResolved").default(0).notNull(), // tickets resolved using this article
  avgHelpfulnessRating: decimal("avgHelpfulnessRating", { precision: 3, scale: 2 }), // 0-5 rating
  lastViewedAt: timestamp("lastViewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KbArticleAnalytic = typeof kbArticleAnalytics.$inferSelect;
export type InsertKbArticleAnalytic = typeof kbArticleAnalytics.$inferInsert;

// KB Article Shares — track when articles are shared with customers/agents
export const kbArticleShares = mysqlTable("kbArticleShares", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  sharedBy: int("sharedBy").notNull(), // userId of agent who shared
  sharedWith: varchar("sharedWith", { length: 255 }), // email address or userId
  sharedVia: mysqlEnum("sharedVia", ["email", "link", "ticket"]).default("email").notNull(),
  ticketId: int("ticketId"), // optional: ticket this was shared from
  message: text("message"), // optional: custom message with share
  sharedAt: timestamp("sharedAt").defaultNow().notNull(),
  viewedAt: timestamp("viewedAt"), // when recipient viewed the share
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KbArticleShare = typeof kbArticleShares.$inferSelect;
export type InsertKbArticleShare = typeof kbArticleShares.$inferInsert;

// KB Article Views — track individual views for analytics
export const kbArticleViews = mysqlTable("kbArticleViews", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  viewedBy: int("viewedBy"), // userId (null for anonymous)
  viewedFrom: mysqlEnum("viewedFrom", ["kb_portal", "ticket_detail", "search_widget", "share_link"]).default("kb_portal").notNull(),
  ticketId: int("ticketId"), // optional: ticket context
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  timeSpent: int("timeSpent"), // seconds spent reading
  helpful: boolean("helpful"), // user marked as helpful
});
export type KbArticleView = typeof kbArticleViews.$inferSelect;
export type InsertKbArticleView = typeof kbArticleViews.$inferInsert;

// KB Search Queries — track what users search for in the KB to identify content gaps
export const kbSearchQueries = mysqlTable("kbSearchQueries", {
  id: int("id").autoincrement().primaryKey(),
  query: varchar("query", { length: 500 }).notNull(), // the search term
  resultsCount: int("resultsCount").default(0).notNull(), // how many results were returned
  clickedArticleId: int("clickedArticleId"), // which article (if any) the user clicked
  source: varchar("source", { length: 50 }).default("kb_portal").notNull(), // 'kb_portal' | 'aria_chat' | 'ticket_widget'
  userId: int("userId"), // null for anonymous
  sessionId: varchar("sessionId", { length: 100 }), // browser session
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KbSearchQuery = typeof kbSearchQueries.$inferSelect;
export type InsertKbSearchQuery = typeof kbSearchQueries.$inferInsert;


// Customer Portal Sessions — track customer self-service portal access
export const customerPortalSessions = mysqlTable("customerPortalSessions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(), // userId of customer
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CustomerPortalSession = typeof customerPortalSessions.$inferSelect;
export type InsertCustomerPortalSession = typeof customerPortalSessions.$inferInsert;

// Notification Preferences — customer choices for notifications
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // customer userId
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  smsNotifications: boolean("smsNotifications").default(false).notNull(),
  inAppNotifications: boolean("inAppNotifications").default(true).notNull(),
  emailFrequency: mysqlEnum("emailFrequency", ["immediate", "daily", "weekly"]).default("immediate").notNull(),
  smsPhoneNumber: varchar("smsPhoneNumber", { length: 20 }), // E.164 format
  notifyOnTicketCreated: boolean("notifyOnTicketCreated").default(true).notNull(),
  notifyOnTicketUpdated: boolean("notifyOnTicketUpdated").default(true).notNull(),
  notifyOnTicketResolved: boolean("notifyOnTicketResolved").default(true).notNull(),
  notifyOnSurveyRequest: boolean("notifyOnSurveyRequest").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// Notification Queue — pending notifications to be sent
export const notificationQueue = mysqlTable("notificationQueue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // recipient userId
  type: mysqlEnum("type", ["email", "sms", "in_app"]).notNull(),
  subject: varchar("subject", { length: 255 }), // for email
  content: text("content").notNull(),
  relatedTicketId: int("relatedTicketId"), // optional: ticket this relates to
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // "ticket", "survey", "kb_article"
  relatedEntityId: int("relatedEntityId"), // ID of related entity
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NotificationQueueItem = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueueItem = typeof notificationQueue.$inferInsert;

// Customer Portal Activity — track customer actions in self-service portal
export const customerPortalActivity = mysqlTable("customerPortalActivity", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  action: mysqlEnum("action", ["view_ticket", "view_kb", "submit_survey", "add_comment", "login", "logout"]).notNull(),
  resourceType: varchar("resourceType", { length: 50 }), // "ticket", "kb_article", "survey"
  resourceId: int("resourceId"), // ID of resource
  metadata: text("metadata"), // additional context (JSON string)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CustomerPortalActivity = typeof customerPortalActivity.$inferSelect;
export type InsertCustomerPortalActivity = typeof customerPortalActivity.$inferInsert;

// Chat Suggestions — track KB article suggestions shown in live chat
export const chatSuggestions = mysqlTable("chatSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  chatSessionId: int("chatSessionId").notNull(), // realtimeChatSessions.id
  articleId: int("articleId").notNull(),
  suggestedBy: mysqlEnum("suggestedBy", ["ai", "agent"]).default("ai").notNull(),
  suggestedAt: timestamp("suggestedAt").defaultNow().notNull(),
  clickedAt: timestamp("clickedAt"), // when user clicked the suggestion
  helpful: boolean("helpful"), // user feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatSuggestion = typeof chatSuggestions.$inferSelect;
export type InsertChatSuggestion = typeof chatSuggestions.$inferInsert;


// Custom User Roles & Permissions
export const customRoles = mysqlTable("customRoles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  permissions: json("permissions").$type<string[]>().notNull(), // Array of permission codes
  isSystem: boolean("isSystem").default(false).notNull(), // System roles cannot be deleted
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userRoleAssignments = mysqlTable("userRoleAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: int("roleId").notNull().references(() => customRoles.id, { onDelete: "cascade" }),
  assignedBy: int("assignedBy").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

// Admin Menu Customization
export const adminMenuCustomization = mysqlTable("adminMenuCustomization", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  menuOrder: json("menuOrder").$type<string[]>().notNull(), // Array of menu item IDs in custom order
  collapsedSections: json("collapsedSections").$type<string[]>().notNull(), // Array of collapsed section names
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = typeof customRoles.$inferInsert;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type AdminMenuCustomization = typeof adminMenuCustomization.$inferSelect;


// Service Health Check History — track health status over time for uptime calculations
export const healthCheckHistory = mysqlTable("healthCheckHistory", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull(), // "Email API", "Helpdesk System", "M365 Service Health"
  status: mysqlEnum("status", ["healthy", "degraded", "critical", "offline"]).notNull(),
  responseTime: int("responseTime").notNull(), // milliseconds
  message: text("message"),
  metrics: json("metrics").$type<Record<string, unknown>>(), // Service-specific metrics
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HealthCheckRecord = typeof healthCheckHistory.$inferSelect;
export type InsertHealthCheckRecord = typeof healthCheckHistory.$inferInsert;

// Alert Thresholds — configurable thresholds for each service
export const alertThresholds = mysqlTable("alertThresholds", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull().unique(), // "Email API", "Helpdesk System", "M365 Service Health"
  
  // Response time threshold (ms) - alert if exceeded
  responseTimeThreshold: int("responseTimeThreshold").default(5000).notNull(),
  
  // Error rate threshold (%) - alert if exceeded
  errorRateThreshold: int("errorRateThreshold").default(10).notNull(),
  
  // Unprocessed tickets threshold - for Helpdesk
  unprocessedTicketsThreshold: int("unprocessedTicketsThreshold").default(50),
  
  // Agent availability threshold (%) - alert if below
  agentAvailabilityThreshold: int("agentAvailabilityThreshold").default(50),
  
  // SLA compliance threshold (%) - alert if below
  slaComplianceThreshold: int("slaComplianceThreshold").default(90),
  
  // Enable/disable alerts for this service
  enabled: boolean("enabled").default(true).notNull(),
  
  // Notification settings
  notifyOnDegraded: boolean("notifyOnDegraded").default(true).notNull(),
  notifyOnCritical: boolean("notifyOnCritical").default(true).notNull(),
  notifyOnRecovery: boolean("notifyOnRecovery").default(true).notNull(),
  
  // Last modified
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = typeof alertThresholds.$inferInsert;

// Uptime Statistics — pre-calculated uptime percentages for dashboard display
export const uptimeStatistics = mysqlTable("uptimeStatistics", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull(),
  
  // Time period
  period: mysqlEnum("period", ["1h", "24h", "7d", "30d"]).notNull(),
  
  // Uptime percentage (0-100)
  uptimePercentage: decimal("uptimePercentage", { precision: 5, scale: 2 }).notNull(),
  
  // Counts
  totalChecks: int("totalChecks").notNull(),
  healthyChecks: int("healthyChecks").notNull(),
  degradedChecks: int("degradedChecks").notNull(),
  criticalChecks: int("criticalChecks").notNull(),
  offlineChecks: int("offlineChecks").notNull(),
  
  // Average response time
  avgResponseTime: int("avgResponseTime"), // milliseconds
  
  // Calculated at
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export type UptimeStatistic = typeof uptimeStatistics.$inferSelect;
export type InsertUptimeStatistic = typeof uptimeStatistics.$inferInsert;

// Service Status Subscriptions — users can subscribe to status updates for specific services
export const serviceStatusSubscriptions = mysqlTable("serviceStatusSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(), // Subscriber email (can be non-user)
  service: varchar("service", { length: 100 }).notNull(), // "Email API", "Helpdesk System", "M365 Service Health"
  
  // Notification preferences
  notifyOnHealthy: boolean("notifyOnHealthy").default(false).notNull(), // Alert when service recovers
  notifyOnDegraded: boolean("notifyOnDegraded").default(true).notNull(), // Alert on degradation
  notifyOnCritical: boolean("notifyOnCritical").default(true).notNull(), // Alert on critical issues
  notifyOnOffline: boolean("notifyOnOffline").default(true).notNull(), // Alert when offline
  
  // Subscription management
  isActive: boolean("isActive").default(true).notNull(),
  unsubscribeToken: varchar("unsubscribeToken", { length: 64 }).unique(), // One-click unsubscribe token
  
  // Tracking
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  lastNotificationSentAt: timestamp("lastNotificationSentAt"),
  unsubscribedAt: timestamp("unsubscribedAt"),
  
  // Unique constraint: one subscription per email+service combo
});

export type ServiceStatusSubscription = typeof serviceStatusSubscriptions.$inferSelect;
export type InsertServiceStatusSubscription = typeof serviceStatusSubscriptions.$inferInsert;

// Service Status Change Log — track all status changes for audit trail
export const serviceStatusChanges = mysqlTable("serviceStatusChanges", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull(),
  previousStatus: mysqlEnum("previousStatus", ["healthy", "degraded", "critical", "offline"]).notNull(),
  newStatus: mysqlEnum("newStatus", ["healthy", "degraded", "critical", "offline"]).notNull(),
  message: text("message"),
  notificationsSent: int("notificationsSent").default(0).notNull(), // Count of emails sent
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type ServiceStatusChange = typeof serviceStatusChanges.$inferSelect;
export type InsertServiceStatusChange = typeof serviceStatusChanges.$inferInsert;


// Microsoft Quick Assist Sessions — track remote support sessions
export const quickAssistSessions = mysqlTable("quickAssistSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionCode: varchar("sessionCode", { length: 10 }).notNull().unique(), // 6-digit code
  ticketId: int("ticketId"), // Link to helpdesk ticket
  customerId: int("customerId"), // Link to customer
  initiatedBy: int("initiatedBy").notNull(), // User who started the session
  description: text("description"), // Session notes
  status: mysqlEnum("status", ["active", "ended", "expired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // 24 hour expiry
  endedAt: timestamp("endedAt"), // When session ended
});

export type QuickAssistSession = typeof quickAssistSessions.$inferSelect;
export type InsertQuickAssistSession = typeof quickAssistSessions.$inferInsert;

// Blog Tags — tags for blog posts
export const blogTags = mysqlTable("blogTags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly version
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = typeof blogTags.$inferInsert;

// Blog Post Tags — junction table for many-to-many relationship
export const blogPostTags = mysqlTable("blogPostTags", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BlogPostTag = typeof blogPostTags.$inferSelect;
export type InsertBlogPostTag = typeof blogPostTags.$inferInsert;

// KB Generation — tracks auto-generated KB articles from tickets
export const kbGenerations = mysqlTable("kbGenerations", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  sourceTicketTitle: varchar("sourceTicketTitle", { length: 500 }).notNull(),
  sourceTicketContent: text("sourceTicketContent").notNull(),
  generatedTitle: varchar("generatedTitle", { length: 500 }).notNull(),
  generatedContent: text("generatedContent").notNull(), // Markdown
  suggestedCategory: varchar("suggestedCategory", { length: 100 }).default("general"),
  suggestedTags: varchar("suggestedTags", { length: 500 }), // comma-separated
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "published", "rejected"]).default("draft").notNull(),
  confidence: int("confidence").default(0), // 0-100 confidence score
  generatedBy: varchar("generatedBy", { length: 50 }).default("copilot"), // "copilot", "agent", "manual"
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  approvedBy: int("approvedBy"), // userId who approved
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  rejectedBy: int("rejectedBy"),
  rejectedAt: timestamp("rejectedAt"),
  publishedArticleId: int("publishedArticleId"), // references kbArticles.id if published
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KbGeneration = typeof kbGenerations.$inferSelect;
export type InsertKbGeneration = typeof kbGenerations.$inferInsert;

// KB Generation Queue — tracks pending KB generation jobs
export const kbGenerationQueue = mysqlTable("kbGenerationQueue", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  priority: int("priority").default(0), // higher = more urgent
  errorMessage: text("errorMessage"),
  attemptCount: int("attemptCount").default(0),
  maxAttempts: int("maxAttempts").default(3),
  nextRetryAt: timestamp("nextRetryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KbGenerationQueue = typeof kbGenerationQueue.$inferSelect;
export type InsertKbGenerationQueue = typeof kbGenerationQueue.$inferInsert;

// KB Suggestions for Tickets — suggests relevant KB articles when creating/viewing tickets
export const ticketKbSuggestions = mysqlTable("ticketKbSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  articleId: int("articleId").notNull().references(() => kbArticles.id, { onDelete: "cascade" }),
  relevanceScore: int("relevanceScore").default(0), // 0-100 relevance score
  suggestedBy: mysqlEnum("suggestedBy", ["ai", "agent"]).default("ai").notNull(),
  suggestedAt: timestamp("suggestedAt").defaultNow().notNull(),
  viewedAt: timestamp("viewedAt"), // when agent viewed the suggestion
  usedAt: timestamp("usedAt"), // when agent used the suggestion to resolve ticket
  helpful: boolean("helpful"), // agent feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TicketKbSuggestion = typeof ticketKbSuggestions.$inferSelect;
export type InsertTicketKbSuggestion = typeof ticketKbSuggestions.$inferInsert;

// KB Generation Metrics — analytics on KB generation performance
export const kbGenerationMetrics = mysqlTable("kbGenerationMetrics", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull().unique(),
  totalGenerated: int("totalGenerated").default(0),
  totalApproved: int("totalApproved").default(0),
  totalPublished: int("totalPublished").default(0),
  totalRejected: int("totalRejected").default(0),
  avgConfidenceScore: int("avgConfidenceScore").default(0),
  avgApprovalTime: int("avgApprovalTime").default(0), // in minutes
  suggestionsShown: int("suggestionsShown").default(0),
  suggestionsUsed: int("suggestionsUsed").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KbGenerationMetric = typeof kbGenerationMetrics.$inferSelect;
export type InsertKbGenerationMetric = typeof kbGenerationMetrics.$inferInsert;

// ─── Companies / Clients ──────────────────────────────────────────────────────

export const companies = mysqlTable("companies", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  industry: varchar("industry", { length: 100 }),
  tier: mysqlEnum("tier", ["starter", "professional", "enterprise"]).default("starter"),
  // Teams per-client channel
  teamsChannelId: varchar("teamsChannelId", { length: 255 }),
  teamsChannelName: varchar("teamsChannelName", { length: 255 }),
  teamsChannelWebhookUrl: varchar("teamsChannelWebhookUrl", { length: 1024 }),
  teamsChannelCreatedAt: timestamp("teamsChannelCreatedAt"),
  // Metadata
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// Per-client Teams channel provisioning log
export const teamsClientChannels = mysqlTable("teamsClientChannels", {
  id: int("id").primaryKey().autoincrement(),
  companyId: int("companyId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  teamsTeamId: varchar("teamsTeamId", { length: 255 }).notNull(),
  teamsChannelId: varchar("teamsChannelId", { length: 255 }).notNull(),
  teamsChannelName: varchar("teamsChannelName", { length: 255 }).notNull(),
  webhookUrl: varchar("webhookUrl", { length: 1024 }),
  provisionedBy: int("provisionedBy"),
  provisionedAt: timestamp("provisionedAt").defaultNow(),
  isActive: boolean("isActive").default(true),
  lastNotificationAt: timestamp("lastNotificationAt"),
  notificationCount: int("notificationCount").default(0),
});

export type TeamsClientChannel = typeof teamsClientChannels.$inferSelect;

// ─── Escalation Pattern Tracking ────────────────────────────────────────────
// Logs every time Aria escalates to a human agent, capturing the original message
// and detected intent so we can surface monthly reports in the admin panel.
export const escalationPatterns = mysqlTable("escalationPatterns", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  originalMessage: text("originalMessage").notNull(),
  detectedIntent: varchar("detectedIntent", { length: 100 }).default("general"),
  intentConfidence: varchar("intentConfidence", { length: 20 }).default("0.5"),
  sentiment: varchar("sentiment", { length: 50 }).default("neutral"),
  sentimentScore: varchar("sentimentScore", { length: 20 }).default("0.5"),
  escalationReason: varchar("escalationReason", { length: 255 }).default("user_requested"),
  kbArticleSuggested: boolean("kbArticleSuggested").default(false),
  kbArticleId: int("kbArticleId"),
  ticketId: int("ticketId"),
  resolvedByAgent: boolean("resolvedByAgent").default(false),
  resolutionNotes: text("resolutionNotes"),
  createdAt: timestamp("createdAt").defaultNow(),
  resolvedAt: timestamp("resolvedAt"),
});
export type EscalationPattern = typeof escalationPatterns.$inferSelect;
export type InsertEscalationPattern = typeof escalationPatterns.$inferInsert;

// ─── Teams Call Logs ─────────────────────────────────────────────────────────
// Stores PSTN call records fetched from Microsoft Graph API.
// Used to detect new inbound support calls and generate draft tickets.
export const callLogs = mysqlTable("callLogs", {
  id: int("id").primaryKey().autoincrement(),
  // Microsoft Graph call record ID (unique per call)
  graphCallId: varchar("graphCallId", { length: 255 }).notNull().unique(),
  // Caller phone number (E.164 format: +12125551234)
  callerNumber: varchar("callerNumber", { length: 50 }),
  // Callee (Teams user) phone number
  calleeNumber: varchar("calleeNumber", { length: 50 }),
  // Display name of Teams user who received the call
  calleeDisplayName: varchar("calleeDisplayName", { length: 255 }),
  // UPN of the Teams user who answered
  calleeUpn: varchar("calleeUpn", { length: 320 }),
  // Matched user ID from our users table (if phone lookup succeeded)
  matchedUserId: int("matchedUserId"),
  // Call direction: inbound = customer calling us, outbound = we called them
  direction: mysqlEnum("direction", ["inbound", "outbound"]).default("inbound"),
  // Call start/end timestamps
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  // Duration in seconds
  durationSeconds: int("durationSeconds"),
  // Whether Teams transcription was available
  hasTranscript: boolean("hasTranscript").default(false),
  // Transcription status: pending=not yet attempted, transcribing=in progress, done=success, failed=error, unavailable=no audio source
  transcriptionStatus: mysqlEnum("transcriptionStatus", ["pending", "transcribing", "done", "failed", "unavailable"]).default("unavailable"),
  // Full transcript text (VTT format converted to plain text)
  transcriptText: text("transcriptText"),
  // AI-generated summary of the call
  aiSummary: text("aiSummary"),
  // AI-suggested ticket title
  aiTitle: varchar("aiTitle", { length: 500 }),
  // AI-suggested priority: low, medium, high, critical
  aiPriority: varchar("aiPriority", { length: 50 }),
  // AI-suggested category
  aiCategory: varchar("aiCategory", { length: 100 }),
  // AI confidence score (0.0 - 1.0)
  aiConfidence: varchar("aiConfidence", { length: 10 }),
  // Processing status
  status: mysqlEnum("status", ["pending", "analyzed", "draft_created", "ticket_created", "dismissed"]).default("pending"),
  // Linked draft ticket ID (once created)
  draftTicketId: int("draftTicketId"),
  // Linked final ticket ID (once approved)
  ticketId: int("ticketId"),
  // ACS recording ID (from startAcsRecording)
  acsRecordingId: varchar("acsRecordingId", { length: 255 }),
  // ACS/S3 recording URL for audit trail
  acsRecordingUrl: varchar("acsRecordingUrl", { length: 2048 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = typeof callLogs.$inferInsert;

// ─── Call Draft Tickets ───────────────────────────────────────────────────────
// Holds AI-generated draft tickets from calls, pending admin review.
// Admin can edit fields before approving to create a real helpdesk ticket.
export const callDraftTickets = mysqlTable("callDraftTickets", {
  id: int("id").primaryKey().autoincrement(),
  // Source call log
  callLogId: int("callLogId").notNull(),
  // Caller info (pre-filled from phone lookup or AI)
  callerPhone: varchar("callerPhone", { length: 50 }),
  callerName: varchar("callerName", { length: 255 }),
  callerEmail: varchar("callerEmail", { length: 320 }),
  // Matched user ID from our system
  userId: int("userId"),
  // Draft ticket fields (editable by admin before approval)
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  priority: varchar("priority", { length: 50 }),
  // Admin review status
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected", "edited"]).default("pending"),
  // Admin who reviewed
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  // Final ticket ID after approval
  ticketId: int("ticketId"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type CallDraftTicket = typeof callDraftTickets.$inferSelect;
export type InsertCallDraftTicket = typeof callDraftTickets.$inferInsert;


// ============================================================================
// PHASE 2: CALL CENTER INTEGRATION TABLES
// ============================================================================

// CALL RECORDING METADATA
export const callRecordings = mysqlTable("call_recordings", {
  id: int("id").primaryKey().autoincrement(),
  callId: varchar("call_id", { length: 255 }).notNull().unique(),
  customerId: int("customer_id"),
  agentId: int("agent_id"),
  recordingUrl: text("recording_url").notNull(),
  recordingKey: varchar("recording_key", { length: 255 }).notNull(),
  duration: int("duration"),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }).default("audio/wav"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending"),
  retentionDays: int("retention_days").default(90),
  expiresAt: timestamp("expires_at"),
  isTranscribed: boolean("is_transcribed").default(false),
  consentGiven: boolean("consent_given").default(true),
  complianceNotes: text("compliance_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type CallRecording = typeof callRecordings.$inferSelect;
export type InsertCallRecording = typeof callRecordings.$inferInsert;

// CALL TRANSCRIPTS
export const callTranscripts = mysqlTable("call_transcripts", {
  id: int("id").primaryKey().autoincrement(),
  recordingId: int("recording_id").notNull(),
  callId: varchar("call_id", { length: 255 }).notNull(),
  fullTranscript: text("full_transcript").notNull(),
  segments: json("segments"),
  language: varchar("language", { length: 10 }).default("en-US"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  keywords: json("keywords"),
  entities: json("entities"),
  summary: text("summary"),
  actionItems: json("action_items"),
  searchable: boolean("searchable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type CallTranscript = typeof callTranscripts.$inferSelect;
export type InsertCallTranscript = typeof callTranscripts.$inferInsert;

// AGENT QUEUES
export const agentQueues = mysqlTable("agent_queues", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  type: mysqlEnum("type", ["general", "senior", "specialist", "vip"]).default("general"),
  priority: int("priority").default(0),
  maxConcurrentCalls: int("max_concurrent_calls").default(5),
  averageWaitTime: int("average_wait_time"),
  callsWaiting: int("calls_waiting").default(0),
  agentCount: int("agent_count").default(0),
  skillRequirements: json("skill_requirements"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type AgentQueue = typeof agentQueues.$inferSelect;
export type InsertAgentQueue = typeof agentQueues.$inferInsert;

// AGENT QUEUE ASSIGNMENTS
export const agentQueueAssignments = mysqlTable("agent_queue_assignments", {
  id: int("id").primaryKey().autoincrement(),
  agentId: int("agent_id").notNull(),
  queueId: int("queue_id").notNull(),
  skillLevel: int("skill_level").default(1),
  assignedAt: timestamp("assigned_at").defaultNow(),
  removedAt: timestamp("removed_at"),
});

export type AgentQueueAssignment = typeof agentQueueAssignments.$inferSelect;
export type InsertAgentQueueAssignment = typeof agentQueueAssignments.$inferInsert;

// CALL ROUTING
export const callRouting = mysqlTable("call_routing", {
  id: int("id").primaryKey().autoincrement(),
  callId: varchar("call_id", { length: 255 }).notNull(),
  customerId: int("customer_id"),
  queueId: int("queue_id"),
  agentId: int("agent_id"),
  routingReason: varchar("routing_reason", { length: 100 }),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
  complexityScore: decimal("complexity_score", { precision: 3, scale: 2 }),
  routingDecision: varchar("routing_decision", { length: 100 }),
  routingTime: int("routing_time"),
  routingConfidence: decimal("routing_confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type CallRouting = typeof callRouting.$inferSelect;
export type InsertCallRouting = typeof callRouting.$inferInsert;

// CALL ANALYTICS
export const callAnalytics = mysqlTable("call_analytics", {
  id: int("id").primaryKey().autoincrement(),
  callId: varchar("call_id", { length: 255 }).notNull(),
  recordingId: int("recording_id"),
  customerId: int("customer_id"),
  agentId: int("agent_id"),
  duration: int("duration"),
  holdTime: int("hold_time"),
  talkTime: int("talk_time"),
  silenceTime: int("silence_time"),
  transferCount: int("transfer_count").default(0),
  initialSentiment: decimal("initial_sentiment", { precision: 3, scale: 2 }),
  finalSentiment: decimal("final_sentiment", { precision: 3, scale: 2 }),
  sentimentTrend: varchar("sentiment_trend", { length: 50 }),
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }),
  npsScore: int("nps_score"),
  effortScore: int("effort_score"),
  isResolved: boolean("is_resolved").default(false),
  resolutionTime: int("resolution_time"),
  requiresFollowUp: boolean("requires_follow_up").default(false),
  aiHandledPercentage: decimal("ai_handled_percentage", { precision: 3, scale: 2 }),
  aiAccuracy: decimal("ai_accuracy", { precision: 3, scale: 2 }),
  kbArticlesUsed: int("kb_articles_used").default(0),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type CallAnalytic = typeof callAnalytics.$inferSelect;
export type InsertCallAnalytic = typeof callAnalytics.$inferInsert;

// AGENT DASHBOARD SESSIONS
export const agentDashboardSessions = mysqlTable("agent_dashboard_sessions", {
  id: int("id").primaryKey().autoincrement(),
  agentId: int("agent_id").notNull(),
  callId: varchar("call_id", { length: 255 }).notNull(),
  liveTranscript: text("live_transcript"),
  suggestedKbArticles: json("suggested_kb_articles"),
  currentSentiment: decimal("current_sentiment", { precision: 3, scale: 2 }),
  sentimentColor: varchar("sentiment_color", { length: 50 }),
  suggestedResponses: json("suggested_responses"),
  isActive: boolean("is_active").default(true),
  sessionStarted: timestamp("session_started").defaultNow(),
  sessionEnded: timestamp("session_ended"),
  lastTranscriptUpdate: timestamp("last_transcript_update"),
  lastSentimentUpdate: timestamp("last_sentiment_update"),
  lastKbUpdate: timestamp("last_kb_update"),
  lastResponseUpdate: timestamp("last_response_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type AgentDashboardSession = typeof agentDashboardSessions.$inferSelect;
export type InsertAgentDashboardSession = typeof agentDashboardSessions.$inferInsert;

// SENTIMENT ROUTING RULES
export const sentimentRoutingRules = mysqlTable("sentiment_routing_rules", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sentimentMin: decimal("sentiment_min", { precision: 3, scale: 2 }),
  sentimentMax: decimal("sentiment_max", { precision: 3, scale: 2 }),
  targetQueueId: int("target_queue_id"),
  targetAgentId: int("target_agent_id"),
  escalateToSenior: boolean("escalate_to_senior").default(false),
  priority: int("priority").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type SentimentRoutingRule = typeof sentimentRoutingRules.$inferSelect;
export type InsertSentimentRoutingRule = typeof sentimentRoutingRules.$inferInsert;

// AI Demo Page - Lead Capture
export const demoLeads = mysqlTable("demoLeads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  scenario: varchar("scenario", { length: 100 }), // Which demo scenario they were viewing
  message: text("message"), // Optional message / question
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DemoLead = typeof demoLeads.$inferSelect;
export type InsertDemoLead = typeof demoLeads.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// SMS CAMPAIGN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/** SMS Contacts — opted-in recipients */
export const smsContacts = mysqlTable("smsContacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(), // E.164 format: +12125551234
  email: varchar("email", { length: 320 }),
  company: varchar("company", { length: 255 }),
  source: varchar("source", { length: 50 }).default("manual").notNull(),
  optedIn: boolean("optedIn").default(true).notNull(),
  optedInAt: timestamp("optedInAt").defaultNow().notNull(),
  optedOutAt: timestamp("optedOutAt"),
  optOutReason: varchar("optOutReason", { length: 100 }),
  tags: json("tags"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SmsContact = typeof smsContacts.$inferSelect;
export type InsertSmsContact = typeof smsContacts.$inferInsert;

/** SMS Campaigns */
export const smsCampaigns = mysqlTable("smsCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "paused", "cancelled"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdBy: int("createdBy"),
  totalRecipients: int("totalRecipients").default(0).notNull(),
  totalSent: int("totalSent").default(0).notNull(),
  totalDelivered: int("totalDelivered").default(0).notNull(),
  totalFailed: int("totalFailed").default(0).notNull(),
  totalOptedOut: int("totalOptedOut").default(0).notNull(),
  fromNumber: varchar("fromNumber", { length: 20 }),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type InsertSmsCampaign = typeof smsCampaigns.$inferInsert;

/** SMS Messages — individual send records */
export const smsMessages = mysqlTable("smsMessages", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  contactId: int("contactId").notNull(),
  toPhone: varchar("toPhone", { length: 20 }).notNull(),
  fromPhone: varchar("fromPhone", { length: 20 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "failed", "undelivered"]).default("queued").notNull(),
  provider: mysqlEnum("provider", ["twilio", "acs"]).default("twilio").notNull(),
  providerMessageId: varchar("providerMessageId", { length: 100 }),
  errorCode: varchar("errorCode", { length: 50 }),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = typeof smsMessages.$inferInsert;

/** SMS Opt-Out Log — TCPA compliance */
export const smsOptOuts = mysqlTable("smsOptOuts", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  contactId: int("contactId"),
  reason: varchar("reason", { length: 100 }).default("STOP").notNull(),
  source: varchar("source", { length: 50 }).default("inbound").notNull(),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
});
export type SmsOptOut = typeof smsOptOuts.$inferSelect;
export type InsertSmsOptOut = typeof smsOptOuts.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// STRIPE PAYMENT SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/** Stripe Customers — maps users to Stripe customer IDs */
export const stripeCustomers = mysqlTable("stripeCustomers", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;

/** Stripe Subscriptions — tracks active helpdesk subscriptions */
export const stripeSubscriptions = mysqlTable("stripeSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  planName: varchar("planName", { length: 50 }).notNull(), // Essential, Professional, Elite
  userCount: int("userCount").notNull(), // Number of users in subscription
  isAnnual: boolean("isAnnual").default(false).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // active, past_due, canceled, unpaid
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

// Xero OAuth Tokens — stores access/refresh tokens for Xero API integration
export const xeroTokens = mysqlTable("xeroTokens", {
  id: int("id").autoincrement().primaryKey(),
  /** Xero tenant ID (organisation ID) returned after OAuth connect */
  tenantId: varchar("tenantId", { length: 255 }).notNull().unique(),
  /** Xero tenant name (organisation name) */
  tenantName: varchar("tenantName", { length: 255 }),
  /** Xero access token (short-lived, ~30 min) */
  accessToken: text("accessToken").notNull(),
  /** Xero refresh token (long-lived) */
  refreshToken: text("refreshToken").notNull(),
  /** When the access token expires (UTC ms) */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Scopes granted during OAuth consent */
  scopes: text("scopes"),
  /** Admin user ID who connected this Xero org */
  connectedBy: int("connectedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type XeroToken = typeof xeroTokens.$inferSelect;
export type InsertXeroToken = typeof xeroTokens.$inferInsert;

// Application Settings — key-value store for system configuration and scheduler state
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(), // e.g., "aiNewsLastRunDate", "emailDigestLastRunDate"
  value: text("value").notNull(), // JSON-serialized value
  description: text("description"), // Optional description of what this setting does
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// FREE AUDIT SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────
/** Free Audit Submissions — captures leads from the free audit landing page */
export const freeAuditSubmissions = mysqlTable("freeAuditSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  // Company Info
  companyName: varchar("companyName", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }).notNull(),
  description: text("description"), // Company description/background
  // Contact Info
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  // Audit Details
  auditType: varchar("auditType", { length: 100 }), // e.g., "Security", "Cloud", "M365", "AI Readiness"
  currentChallenges: text("currentChallenges"), // What challenges are they facing?
  goals: text("goals"), // What are their goals?
  // Status & Tracking
  status: mysqlEnum("status", ["submitted", "contacted", "in_progress", "completed", "archived"]).default("submitted").notNull(),
  notes: text("notes"), // Admin notes
  assignedTo: int("assignedTo"), // Admin user ID
  // Timestamps
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  contactedAt: timestamp("contactedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FreeAuditSubmission = typeof freeAuditSubmissions.$inferSelect;
export type InsertFreeAuditSubmission = typeof freeAuditSubmissions.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// CALL QUALITY SCORES
// ─────────────────────────────────────────────────────────────────────────────
/**
 * AI-generated quality scores for call transcripts.
 * Each scored call gets one row with rubric-based category scores and an overall total.
 * Linked to callLogs via callLogId.
 */
export const callQualityScores = mysqlTable("callQualityScores", {
  id: int("id").autoincrement().primaryKey(),
  // Source call log
  callLogId: int("callLogId").notNull().unique(),
  // Agent who handled the call
  agentName: varchar("agentName", { length: 255 }),
  agentUpn: varchar("agentUpn", { length: 320 }),
  // Rubric category scores (0–10 each)
  scoreGreeting: int("scoreGreeting"),         // Professional greeting & intro
  scoreEmpathy: int("scoreEmpathy"),           // Empathy & active listening
  scoreTechnical: int("scoreTechnical"),       // Technical accuracy & knowledge
  scoreResolution: int("scoreResolution"),     // Problem resolution effectiveness
  scoreCommunication: int("scoreCommunication"), // Clarity & communication style
  scoreCompliance: int("scoreCompliance"),     // Compliance & procedure adherence
  // Weighted total (0–100)
  totalScore: int("totalScore"),
  // Letter grade: A, B, C, D, F
  grade: varchar("grade", { length: 2 }),
  // AI narrative summary of the call quality
  aiSummary: text("aiSummary"),
  // Key strengths identified
  strengths: text("strengths"),
  // Areas for improvement
  improvements: text("improvements"),
  // Scoring model version (for future rubric changes)
  modelVersion: varchar("modelVersion", { length: 20 }).default("v1").notNull(),
  // Whether this was manually triggered or auto-scored
  scoredBy: mysqlEnum("scoredBy", ["auto", "manual"]).default("auto").notNull(),
  scoredAt: timestamp("scoredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CallQualityScore = typeof callQualityScores.$inferSelect;
export type InsertCallQualityScore = typeof callQualityScores.$inferInsert;
