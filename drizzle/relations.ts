import { relations } from "drizzle-orm/relations";
import { users, adminMenuCustomization, blogPosts, blogPostTags, blogTags, tickets, customerFeedback, kbArticles, kbArticleComments, kbArticleRatings, kbArticleTags, kbArticleVersions, kbGenerationQueue, kbGenerations, ticketKbSuggestions, userActivity, userRoleAssignments, customRoles } from "./schema";

export const adminMenuCustomizationRelations = relations(adminMenuCustomization, ({one}) => ({
	user: one(users, {
		fields: [adminMenuCustomization.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	adminMenuCustomizations: many(adminMenuCustomization),
	customerFeedbacks: many(customerFeedback),
	userActivities: many(userActivity),
	userRoleAssignments: many(userRoleAssignments),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({one}) => ({
	blogPost: one(blogPosts, {
		fields: [blogPostTags.postId],
		references: [blogPosts.id]
	}),
	blogTag: one(blogTags, {
		fields: [blogPostTags.tagId],
		references: [blogTags.id]
	}),
}));

export const blogPostsRelations = relations(blogPosts, ({many}) => ({
	blogPostTags: many(blogPostTags),
}));

export const blogTagsRelations = relations(blogTags, ({many}) => ({
	blogPostTags: many(blogPostTags),
}));

export const customerFeedbackRelations = relations(customerFeedback, ({one}) => ({
	ticket: one(tickets, {
		fields: [customerFeedback.ticketId],
		references: [tickets.id]
	}),
	user: one(users, {
		fields: [customerFeedback.userId],
		references: [users.id]
	}),
}));

export const ticketsRelations = relations(tickets, ({many}) => ({
	customerFeedbacks: many(customerFeedback),
	kbGenerationQueues: many(kbGenerationQueue),
	kbGenerations: many(kbGenerations),
	ticketKbSuggestions: many(ticketKbSuggestions),
}));

export const kbArticleCommentsRelations = relations(kbArticleComments, ({one}) => ({
	kbArticle: one(kbArticles, {
		fields: [kbArticleComments.articleId],
		references: [kbArticles.id]
	}),
}));

export const kbArticlesRelations = relations(kbArticles, ({many}) => ({
	kbArticleComments: many(kbArticleComments),
	kbArticleRatings: many(kbArticleRatings),
	kbArticleTags: many(kbArticleTags),
	kbArticleVersions: many(kbArticleVersions),
	ticketKbSuggestions: many(ticketKbSuggestions),
}));

export const kbArticleRatingsRelations = relations(kbArticleRatings, ({one}) => ({
	kbArticle: one(kbArticles, {
		fields: [kbArticleRatings.articleId],
		references: [kbArticles.id]
	}),
}));

export const kbArticleTagsRelations = relations(kbArticleTags, ({one}) => ({
	kbArticle: one(kbArticles, {
		fields: [kbArticleTags.articleId],
		references: [kbArticles.id]
	}),
}));

export const kbArticleVersionsRelations = relations(kbArticleVersions, ({one}) => ({
	kbArticle: one(kbArticles, {
		fields: [kbArticleVersions.articleId],
		references: [kbArticles.id]
	}),
}));

export const kbGenerationQueueRelations = relations(kbGenerationQueue, ({one}) => ({
	ticket: one(tickets, {
		fields: [kbGenerationQueue.ticketId],
		references: [tickets.id]
	}),
}));

export const kbGenerationsRelations = relations(kbGenerations, ({one}) => ({
	ticket: one(tickets, {
		fields: [kbGenerations.ticketId],
		references: [tickets.id]
	}),
}));

export const ticketKbSuggestionsRelations = relations(ticketKbSuggestions, ({one}) => ({
	ticket: one(tickets, {
		fields: [ticketKbSuggestions.ticketId],
		references: [tickets.id]
	}),
	kbArticle: one(kbArticles, {
		fields: [ticketKbSuggestions.articleId],
		references: [kbArticles.id]
	}),
}));

export const userActivityRelations = relations(userActivity, ({one}) => ({
	user: one(users, {
		fields: [userActivity.userId],
		references: [users.id]
	}),
}));

export const userRoleAssignmentsRelations = relations(userRoleAssignments, ({one}) => ({
	user: one(users, {
		fields: [userRoleAssignments.userId],
		references: [users.id]
	}),
	customRole: one(customRoles, {
		fields: [userRoleAssignments.roleId],
		references: [customRoles.id]
	}),
}));

export const customRolesRelations = relations(customRoles, ({many}) => ({
	userRoleAssignments: many(userRoleAssignments),
}));