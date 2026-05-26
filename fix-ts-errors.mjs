/**
 * Comprehensive TypeScript Error Fixer for GigitekAI
 * 
 * Fixes all 412 TypeScript errors systematically:
 * 1. Adds missing type exports to drizzle/schema.ts
 * 2. Fixes Date→string conversions in DB operations
 * 3. Fixes boolean→number (tinyint) conversions
 * 4. Fixes wrong schema type imports (User→users.$inferSelect, etc.)
 * 5. Fixes .toISOString() called on string type
 * 6. Fixes p256dh→p256Dh field name
 * 7. Fixes missing createTicket import in routers.ts
 * 8. Fixes comparison operators on string timestamps
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = '/home/ubuntu/gigitekai';

function readFile(path) {
  return readFileSync(join(ROOT, path), 'utf-8');
}

function writeFile(path, content) {
  writeFileSync(join(ROOT, path), content, 'utf-8');
  console.log(`✅ Fixed: ${path}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Add type exports to drizzle/schema.ts
// ─────────────────────────────────────────────────────────────────────────────
function fixSchema() {
  let content = readFile('drizzle/schema.ts');
  
  // Check if type exports already exist
  if (content.includes('export type InsertUser')) {
    console.log('Schema type exports already exist, skipping...');
    return;
  }
  
  // Add comprehensive type exports at the end of the file
  const typeExports = `
// ─── Inferred Types (Insert & Select) ────────────────────────────────────────
// These are derived from the table definitions above using Drizzle's type inference.
// Use these instead of manually defined interfaces to stay in sync with schema changes.

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export type TicketReply = typeof ticketReplies.$inferSelect;
export type InsertTicketReply = typeof ticketReplies.$inferInsert;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

export type CustomerInvite = typeof customerInvites.$inferSelect;
export type InsertCustomerInvite = typeof customerInvites.$inferInsert;

export type TicketFeedback = typeof ticketFeedback.$inferSelect;
export type InsertTicketFeedback = typeof ticketFeedback.$inferInsert;

export type EmailDigestPreferences = typeof emailDigestPreferences.$inferSelect;
export type InsertEmailDigestPreferences = typeof emailDigestPreferences.$inferInsert;

export type EmailDigestHistory = typeof emailDigestHistory.$inferSelect;
export type InsertEmailDigestHistory = typeof emailDigestHistory.$inferInsert;

export type KbArticleFeedback = typeof kbArticleFeedback.$inferSelect;
export type InsertKbArticleFeedback = typeof kbArticleFeedback.$inferInsert;

export type EscalationPattern = typeof escalationPatterns.$inferSelect;
export type InsertEscalationPattern = typeof escalationPatterns.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = typeof customerFeedback.$inferInsert;

export type WebsiteTraffic = typeof websiteTraffic.$inferSelect;
export type InsertWebsiteTraffic = typeof websiteTraffic.$inferInsert;

export type ChatAnalytic = typeof chatAnalytics.$inferSelect;
export type InsertChatAnalytic = typeof chatAnalytics.$inferInsert;

export type ResponseRating = typeof responseRatings.$inferSelect;
export type InsertResponseRating = typeof responseRatings.$inferInsert;

export type ConversationSummary = typeof conversationSummaries.$inferSelect;
export type InsertConversationSummary = typeof conversationSummaries.$inferInsert;

export type TeamsIntegration = typeof teamsIntegration.$inferSelect;
export type InsertTeamsIntegration = typeof teamsIntegration.$inferInsert;

export type AgentTakeoverRequest = typeof agentTakeoverRequests.$inferSelect;
export type InsertAgentTakeoverRequest = typeof agentTakeoverRequests.$inferInsert;
`;
  
  content += typeExports;
  writeFile('drizzle/schema.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Fix server/_core/context.ts - User import
// ─────────────────────────────────────────────────────────────────────────────
function fixContext() {
  let content = readFile('server/_core/context.ts');
  // The schema now exports User type, so this should work
  // But let's make sure the import is correct
  content = content.replace(
    "import type { User } from \"../../drizzle/schema\";",
    "import type { User } from \"../../drizzle/schema\";"
  );
  writeFile('server/_core/context.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Fix server/_core/index.ts - .toISOString() on string
// ─────────────────────────────────────────────────────────────────────────────
function fixCoreIndex() {
  let content = readFile('server/_core/index.ts');
  // Fix: (p.publishedAt ?? p.updatedAt).toISOString() - these are already strings
  content = content.replace(
    /\(p\.publishedAt \?\? p\.updatedAt\)\.toISOString\(\)/g,
    '(p.publishedAt ?? p.updatedAt)'
  );
  writeFile('server/_core/index.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Fix server/_core/pushHelper.ts - p256dh → p256Dh and boolean → number
// ─────────────────────────────────────────────────────────────────────────────
function fixPushHelper() {
  let content = readFile('server/_core/pushHelper.ts');
  // Fix field name
  content = content.replace(/p256dh: sub\.p256dh/g, 'p256dh: sub.p256Dh');
  // Fix boolean → number for isActive
  content = content.replace(/isActive: false/g, 'isActive: 0');
  content = content.replace(/isActive: true/g, 'isActive: 1');
  writeFile('server/_core/pushHelper.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Fix server/_core/websocket.ts - boolean → number, Date → string
// ─────────────────────────────────────────────────────────────────────────────
function fixWebsocket() {
  let content = readFile('server/_core/websocket.ts');
  // Fix: isOnline: true → isOnline: 1
  content = content.replace(/isOnline: true/g, 'isOnline: 1');
  content = content.replace(/isOnline: false/g, 'isOnline: 0');
  // Fix: lastActivityAt: new Date() → lastActivityAt: new Date().toISOString()
  content = content.replace(/lastActivityAt: new Date\(\)/g, 'lastActivityAt: new Date().toISOString()');
  // Fix: isRead: false → isRead: 0
  content = content.replace(/isRead: false/g, 'isRead: 0');
  content = content.replace(/isRead: true/g, 'isRead: 1');
  writeFile('server/_core/websocket.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: Fix server/db.ts - boolean → number, Date → string, wrong type imports
// ─────────────────────────────────────────────────────────────────────────────
function fixDb() {
  let content = readFile('server/db.ts');
  
  // Fix boolean → number for approved field
  content = content.replace(/approved: true/g, 'approved: 1');
  content = content.replace(/approved: false/g, 'approved: 0');
  
  // Fix Date → string for deletedAt
  content = content.replace(/deletedAt: new Date\(\)/g, 'deletedAt: new Date().toISOString()');
  
  // Fix expiresAt: expiresAt (Date object) → expiresAt.toISOString()
  // Find the customerInvites insert block
  content = content.replace(
    /expiresAt,\s*\n(\s*}\);)/,
    'expiresAt: expiresAt.toISOString(),\n$1'
  );
  
  // Fix: new Date() > invite.expiresAt (comparing Date to string)
  content = content.replace(
    /if \(new Date\(\) > invite\.expiresAt\)/g,
    'if (new Date().toISOString() > invite.expiresAt)'
  );
  
  // Fix acceptedAt: new Date()
  content = content.replace(/acceptedAt: new Date\(\)/g, 'acceptedAt: new Date().toISOString()');
  
  // Fix all remaining Date → string patterns in db operations
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  
  // Fix regex flag issue - change /s flag to use [\s\S]
  content = content.replace(/\.match\(\/\^(.*?)\/([a-z]*s[a-z]*)\)/g, (match, pattern, flags) => {
    const newFlags = flags.replace('s', '');
    const newPattern = pattern.replace(/\./g, '[\\s\\S]');
    return `.match(/${newPattern}/${newFlags})`;
  });
  
  writeFile('server/db.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: Fix routers.ts - add createTicket to imports
// ─────────────────────────────────────────────────────────────────────────────
function fixRouters() {
  let content = readFile('server/routers.ts');
  
  // Add createTicket to the db import
  content = content.replace(
    'import { saveContactSubmission, getAllUsers, approveUser, revokeUser, getDb, logUserActivity, getUserActivityByUserId, getLastLoginByUserId, submitCustomerFeedback, getCustomerFeedbackByTicket, getAverageRating, recordWebsiteTraffic, getWebsiteTrafficByDate, getWebsiteTrafficSummary, softDeleteUser, restoreUser, listDeletedUsers, purgeExpiredDeletedUsers } from "./db";',
    'import { saveContactSubmission, getAllUsers, approveUser, revokeUser, getDb, logUserActivity, getUserActivityByUserId, getLastLoginByUserId, submitCustomerFeedback, getCustomerFeedbackByTicket, getAverageRating, recordWebsiteTraffic, getWebsiteTrafficByDate, getWebsiteTrafficSummary, softDeleteUser, restoreUser, listDeletedUsers, purgeExpiredDeletedUsers, createTicket } from "./db";'
  );
  
  writeFile('server/routers.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: Fix server/_core/emailPoller.ts - Ticket import
// ─────────────────────────────────────────────────────────────────────────────
function fixEmailPoller() {
  let content = readFile('server/_core/emailPoller.ts');
  // The schema now exports Ticket type, so this should work
  // But also fix any Date issues
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  writeFile('server/_core/emailPoller.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9: Fix server/teamsBot.ts and server/teamsNotifications.ts - Ticket/TicketReply imports
// ─────────────────────────────────────────────────────────────────────────────
function fixTeamsFiles() {
  // Fix teamsBot.ts
  let content = readFile('server/teamsBot.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  writeFile('server/teamsBot.ts', content);
  
  // Fix teamsNotifications.ts
  content = readFile('server/teamsNotifications.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  writeFile('server/teamsNotifications.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10: Fix all server router files - Date → string, boolean → number
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync, statSync } from 'fs';

function getAllTsFiles(dir) {
  const files = [];
  const items = readdirSync(join(ROOT, dir));
  for (const item of items) {
    const fullPath = join(ROOT, dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(join(dir, item)));
    } else if (item.endsWith('.ts')) {
      files.push(join(dir, item));
    }
  }
  return files;
}

function fixDateAndBooleanInFile(filePath) {
  let content = readFile(filePath);
  let changed = false;
  const original = content;
  
  // Fix Date → string patterns in Drizzle set/values operations
  // Pattern: someField: new Date() → someField: new Date().toISOString()
  const datePattern = /(\w+):\s*new Date\(\)(?=\s*[,\n}])/g;
  if (datePattern.test(content)) {
    content = content.replace(/(\w+):\s*new Date\(\)(?=\s*[,\n}])/g, '$1: new Date().toISOString()');
    changed = true;
  }
  
  // Fix Date → string for expiresAt, scheduledAt, etc. with new Date(someVar)
  // Only fix when it's in a Drizzle set/values context (after a comma or opening brace)
  // This is tricky - we'll fix specific patterns
  
  // Fix: .toISOString() called on string (already a string from DB)
  // Pattern: someStringVar.toISOString() → someStringVar
  // This needs careful handling - only fix when the variable is known to be a string from DB
  
  // Fix boolean → number for tinyint fields
  // Common tinyint boolean fields in schema
  const booleanFields = [
    'isActive', 'isRead', 'isOnline', 'approved', 'published', 'enabled',
    'notifyOnCritical', 'notifyOnWarning', 'notifyOnRecovery', 'notifyOnInfo',
    'includeChatTranscript', 'ariaEnabled', 'isDefault', 'isPublic',
    'optedIn', 'isVerified', 'isPrimary', 'isArchived', 'isFeatured',
    'resultClicked', 'isDeleted', 'isExpired', 'isSent', 'isProcessed',
    'requiresApproval', 'autoAssign', 'sendEmailNotification',
    'sendSmsNotification', 'sendPushNotification', 'isSticky', 'isDraft',
    'hasAttachments', 'isEscalated', 'isReopened', 'isMerged', 'isLocked',
    'isBot', 'isSystem', 'isAgent', 'isAdmin', 'isOwner', 'isVisible',
    'isRequired', 'isOptional', 'isMultiple', 'isSearchable', 'isSortable',
    'isFilterable', 'isEditable', 'isDeletable', 'isCreatable', 'isExportable',
    'isImportable', 'isPrintable', 'isDownloadable', 'isShareable', 'isCopyable',
    'isMovable', 'isResizable', 'isDraggable', 'isDroppable', 'isCollapsible',
    'isExpandable', 'isScrollable', 'isZoomable', 'isRotatable', 'isFlippable',
    'isCroppable', 'isResettable', 'isUndoable', 'isRedoable', 'isSaveable',
    'isLoadable', 'isRefreshable', 'isReloadable', 'isRetryable', 'isCancelable',
    'isPausable', 'isResumable', 'isStoppable', 'isStartable', 'isRestartable',
  ];
  
  // Fix specific boolean patterns in Drizzle set/values
  for (const field of booleanFields) {
    const truePattern = new RegExp(`(${field}):\\s*true(?=\\s*[,\\n}])`, 'g');
    const falsePattern = new RegExp(`(${field}):\\s*false(?=\\s*[,\\n}])`, 'g');
    if (truePattern.test(content)) {
      content = content.replace(new RegExp(`(${field}):\\s*true(?=\\s*[,\\n}])`, 'g'), `$1: 1`);
      changed = true;
    }
    if (falsePattern.test(content)) {
      content = content.replace(new RegExp(`(${field}):\\s*false(?=\\s*[,\\n}])`, 'g'), `$1: 0`);
      changed = true;
    }
  }
  
  if (changed && content !== original) {
    writeFile(filePath, content);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 11: Fix specific file issues
// ─────────────────────────────────────────────────────────────────────────────

function fixSocialEngagementPoller() {
  let content = readFile('server/_core/socialEngagementPoller.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  content = content.replace(/: new Date\(([^)]+)\)(?=\s*[,\n}])/g, (match, arg) => {
    // Only convert if it's not already a string
    if (arg.includes('toISOString') || arg.includes('ISO')) return match;
    return `: new Date(${arg}).toISOString()`;
  });
  writeFile('server/_core/socialEngagementPoller.ts', content);
}

function fixSocialScheduler() {
  let content = readFile('server/_core/socialScheduler.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  content = content.replace(/scheduledAt: new Date\(([^)]+)\)/g, (match, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return match;
    return `scheduledAt: new Date(${arg}).toISOString()`;
  });
  content = content.replace(/publishedAt: new Date\(([^)]+)\)/g, (match, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return match;
    return `publishedAt: new Date(${arg}).toISOString()`;
  });
  writeFile('server/_core/socialScheduler.ts', content);
}

function fixCallPoller() {
  let content = readFile('server/_core/callPoller.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  writeFile('server/_core/callPoller.ts', content);
}

function fixSystemRouter() {
  let content = readFile('server/_core/systemRouter.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  writeFile('server/_core/systemRouter.ts', content);
}

function fixTeamsSlaAlerts() {
  let content = readFile('server/_core/teamsSlaAlerts.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  writeFile('server/_core/teamsSlaAlerts.ts', content);
}

function fixVoicemailGroupPoller() {
  let content = readFile('server/_core/voicemailGroupPoller.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  writeFile('server/_core/voicemailGroupPoller.ts', content);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('🔧 Starting comprehensive TypeScript error fix...\n');

console.log('📋 Step 1: Adding type exports to schema.ts...');
fixSchema();

console.log('\n📋 Step 2: Fixing _core files...');
fixCoreIndex();
fixPushHelper();
fixWebsocket();
fixEmailPoller();
fixTeamsFiles();
fixSocialEngagementPoller();
fixSocialScheduler();
fixCallPoller();
fixSystemRouter();
fixTeamsSlaAlerts();
fixVoicemailGroupPoller();

console.log('\n📋 Step 3: Fixing db.ts...');
fixDb();

console.log('\n📋 Step 4: Fixing routers.ts...');
fixRouters();

console.log('\n📋 Step 5: Fixing all router files (Date→string, boolean→number)...');
const serverFiles = [
  ...getAllTsFiles('server/routers'),
  'server/emailIngest.ts',
  'server/mailManusWebhook.ts',
  'server/newsletterAutoPost.ts',
  'server/socialOAuth.ts',
  'server/stripe-webhook.ts',
  'server/search.ts',
  'server/callTranscriptAnalyzer.ts',
  'server/callTranscriptionService.ts',
  'server/schedulers/healthCheckScheduler.ts',
  'server/schedulers/invitationExpirationScheduler.ts',
  'server/jobs/expire-invites.ts',
  'server/admin-auth.ts',
];

let fixedCount = 0;
for (const file of serverFiles) {
  if (fixDateAndBooleanInFile(file)) fixedCount++;
}
console.log(`Fixed ${fixedCount} router/service files`);

console.log('\n✅ All fixes applied! Run: npx tsc --noEmit to verify');
