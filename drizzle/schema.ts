import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum, date, decimal } from "drizzle-orm/mysql-core";
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
  status: mysqlEnum("status", ["open", "in_progress", "on_hold", "resolved", "closed"]).default("open").notNull(),
  assignedTo: int("assignedTo"), // userId of assigned agent
  // AI Triage fields
  aiCategory: varchar("aiCategory", { length: 100 }), // LLM-suggested category
  aiPriority: varchar("aiPriority", { length: 20 }), // LLM-suggested priority
  aiConfidence: decimal("aiConfidence", { precision: 4, scale: 2 }), // 0.00-1.00
  aiReasoning: text("aiReasoning"), // LLM explanation
  source: varchar("source", { length: 50 }).default("web").notNull(), // 'web' | 'email' | 'chat'
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KbArticle = typeof kbArticles.$inferSelect;
export type InsertKbArticle = typeof kbArticles.$inferInsert;

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
  status: mysqlEnum("status", ["published", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  publishedAt: timestamp("publishedAt"),
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
