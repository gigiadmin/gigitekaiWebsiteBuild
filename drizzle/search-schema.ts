import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Search Index Table
 * Stores searchable content from all pages, blog posts, KB articles, services, etc.
 * Supports full-text search and semantic search via embeddings.
 */
export const searchIndex = mysqlTable("searchIndex", {
  id: int("id").autoincrement().primaryKey(),
  
  // Content identification
  contentType: mysqlEnum("contentType", [
    "page",           // Static pages (services, industries, etc.)
    "blog",           // Blog posts
    "kb",             // Knowledge base articles
    "faq",            // FAQ entries
    "service",        // Service pages
    "industry",       // Industry pages
    "pricing",        // Pricing pages
    "case_study",     // Case studies
  ]).notNull(),
  
  sourceId: varchar("sourceId", { length: 255 }).notNull(), // ID from source table (e.g., blog post ID)
  
  // Content fields for full-text search
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt").notNull(), // 100-200 char summary
  content: text("content").notNull(), // Full searchable content
  
  // URL and metadata
  url: varchar("url", { length: 1000 }).notNull(),
  metadata: json("metadata").$type<{
    author?: string;
    category?: string;
    tags?: string[];
    date?: string;
    readTime?: string;
    imageUrl?: string;
  }>(),
  
  // Semantic search embedding (vector representation of content)
  // Stored as JSON for MySQL compatibility (can be migrated to vector DB later)
  embedding: text("embedding"), // JSON stringified float32 array
  
  // Search ranking factors
  popularity: int("popularity").default(0), // Click count or view count
  relevanceScore: int("relevanceScore").default(0), // Computed relevance (0-100)
  
  // Indexing metadata
  indexed: boolean("indexed").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  
  // Full-text index on title and content for MySQL FULLTEXT search
  // Note: Drizzle doesn't support FULLTEXT index directly, so we'll add via migration
});

export type SearchIndex = typeof searchIndex.$inferSelect;
export type InsertSearchIndex = typeof searchIndex.$inferInsert;

/**
 * Search Analytics Table
 * Tracks user search queries, click-through rates, and popular searches
 */
export const searchAnalytics = mysqlTable("searchAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Query information
  query: varchar("query", { length: 500 }).notNull(),
  resultsCount: int("resultsCount").default(0).notNull(),
  
  // User interaction
  userId: int("userId"), // Optional: logged-in user ID
  sessionId: varchar("sessionId", { length: 255 }).notNull(), // Session identifier
  
  // Click tracking
  clickedResultId: int("clickedResultId"), // Which search result was clicked
  clickedUrl: varchar("clickedUrl", { length: 1000 }), // URL of clicked result
  clickPosition: int("clickPosition"), // Position in results (1st, 2nd, etc.)
  
  // Query quality metrics
  hasResults: boolean("hasResults").notNull(), // Did query return any results?
  noResultsQuery: boolean("noResultsQuery").default(false).notNull(), // Flag for no-results queries
  
  // Metadata
  userAgent: varchar("userAgent", { length: 500 }), // Browser/device info
  referrer: varchar("referrer", { length: 1000 }), // Where user came from
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchAnalytic = typeof searchAnalytics.$inferSelect;
export type InsertSearchAnalytic = typeof searchAnalytics.$inferInsert;

/**
 * Search Suggestions Table
 * Pre-computed suggestions for real-time autocomplete
 */
export const searchSuggestions = mysqlTable("searchSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Suggestion text
  suggestion: varchar("suggestion", { length: 255 }).notNull().unique(),
  
  // Suggestion metadata
  type: mysqlEnum("type", [
    "popular",        // Popular search term
    "trending",       // Trending search
    "content_title",  // Exact content title
    "auto_complete",  // Auto-completion suggestion
  ]).notNull(),
  
  // Ranking
  popularity: int("popularity").default(0).notNull(), // How often searched
  clickThroughRate: int("clickThroughRate").default(0).notNull(), // CTR percentage
  
  // Metadata
  relatedContentIds: text("relatedContentIds"), // JSON array of related search index IDs
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SearchSuggestion = typeof searchSuggestions.$inferSelect;
export type InsertSearchSuggestion = typeof searchSuggestions.$inferInsert;
