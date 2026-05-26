/**
 * TypeScript Error Fix - Pass 2
 * Targets remaining errors after pass 1:
 * 1. context.ts - synthetic User object uses Date/boolean, needs string/number
 * 2. sdk.ts - lastSignedIn: Date → string
 * 3. db.ts - remaining Date/boolean issues (gte comparisons, approved field)
 * 4. search.ts - missing columns (popularity, noResultsQuery, clickedUrl)
 * 5. admin-search-index.ts - post.author→authorName, post.tags, toISOString on string
 * 6. Various routers - remaining Date/boolean issues
 * 7. stripe-webhook.ts - Date→string for timestamps
 * 8. client-side fixes
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

// ─── Fix context.ts: synthetic User object uses Date/boolean ───────────────
function fixContext() {
  let content = readFile('server/_core/context.ts');
  // Replace the synthetic user object that uses Date and boolean
  content = content.replace(
    /user = \{\s*id: payload\.adminId,\s*openId: `admin-\$\{payload\.adminId\}`,\s*name: payload\.name \|\| null,\s*email: payload\.email \|\| null,\s*loginMethod: "admin",\s*role: payload\.role === "admin" \? "admin" : "user",\s*approved: true,\s*createdAt: new Date\(\),\s*updatedAt: new Date\(\),\s*lastSignedIn: new Date\(\),\s*deletedAt: null,/g,
    `user = {
          id: payload.adminId,
          openId: \`admin-\${payload.adminId}\`,
          name: payload.name || null,
          email: payload.email || null,
          loginMethod: "admin",
          role: (payload.role === "admin" ? "admin" : "user") as "admin" | "user" | "technician",
          approved: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSignedIn: new Date().toISOString(),
          deletedAt: null,`
  );
  writeFile('server/_core/context.ts', content);
}

// ─── Fix sdk.ts: lastSignedIn Date → string ────────────────────────────────
function fixSdk() {
  let content = readFile('server/_core/sdk.ts');
  // Fix: lastSignedIn: signedInAt (where signedInAt is Date)
  // Find where signedInAt is defined and make it a string
  content = content.replace(
    /const signedInAt = new Date\(\)/g,
    'const signedInAt = new Date().toISOString()'
  );
  // Also fix direct Date assignments to lastSignedIn
  content = content.replace(
    /lastSignedIn: new Date\(\)/g,
    'lastSignedIn: new Date().toISOString()'
  );
  writeFile('server/_core/sdk.ts', content);
}

// ─── Fix db.ts: remaining issues ──────────────────────────────────────────
function fixDb() {
  let content = readFile('server/db.ts');
  
  // Fix approved: true/false → 1/0 (remaining ones not caught by pass 1)
  content = content.replace(/approved: true/g, 'approved: 1');
  content = content.replace(/approved: false/g, 'approved: 0');
  
  // Fix: values.approved = true/false
  content = content.replace(/values\.approved = true/g, 'values.approved = 1');
  content = content.replace(/values\.approved = false/g, 'values.approved = 0');
  content = content.replace(/updateSet\.approved = true/g, 'updateSet.approved = 1');
  content = content.replace(/updateSet\.approved = false/g, 'updateSet.approved = 0');
  
  // Fix: values.lastSignedIn = new Date()
  content = content.replace(/values\.lastSignedIn = new Date\(\)/g, 'values.lastSignedIn = new Date().toISOString()');
  content = content.replace(/updateSet\.lastSignedIn = new Date\(\)/g, 'updateSet.lastSignedIn = new Date().toISOString()');
  
  // Fix: gte(chatLeads.createdAt, new Date(...)) → gte(chatLeads.createdAt, new Date(...).toISOString())
  content = content.replace(
    /gte\(chatLeads\.createdAt, new Date\(Date\.now\(\) - 24 \* 60 \* 60 \* 1000\)\)/g,
    'gte(chatLeads.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())'
  );
  
  // Fix: gte(websiteTraffic.date, startDate) where startDate is Date
  content = content.replace(
    /gte\(websiteTraffic\.date, startDate\)/g,
    'gte(websiteTraffic.date, typeof startDate === "string" ? startDate : startDate.toISOString().split("T")[0])'
  );
  
  // Fix: eq(users.approved, false) → eq(users.approved, 0)
  content = content.replace(/eq\(users\.approved, false\)/g, 'eq(users.approved, 0)');
  content = content.replace(/eq\(users\.approved, true\)/g, 'eq(users.approved, 1)');
  
  // Fix: eq(emailDigestPreferences.enabled, true) → eq(emailDigestPreferences.enabled, 1)
  content = content.replace(/eq\(emailDigestPreferences\.enabled, true\)/g, 'eq(emailDigestPreferences.enabled, 1)');
  content = content.replace(/eq\(emailDigestPreferences\.enabled, false\)/g, 'eq(emailDigestPreferences.enabled, 0)');
  
  // Fix: gte(escalationPatterns.createdAt, opts.startDate) where startDate is Date
  content = content.replace(
    /gte\(escalationPatterns\.createdAt, opts\.startDate\)/g,
    'gte(escalationPatterns.createdAt, opts.startDate instanceof Date ? opts.startDate.toISOString() : opts.startDate)'
  );
  content = content.replace(
    /gte\(escalationPatterns\.createdAt, startDate\)/g,
    'gte(escalationPatterns.createdAt, startDate instanceof Date ? startDate.toISOString() : startDate)'
  );
  
  // Fix regex /s flag - change to use workaround
  content = content.replace(
    /responseText\.match\(\/\\\[.*\\\]\/s\)/g,
    'responseText.match(/\\[[\\s\\S]*\\]/)'
  );
  // More general fix for /s flag
  content = content.replace(/\/\[.*\]\/s/g, '/[\\s\\S]*/');
  
  // Fix the specific regex match issue on line 1405
  content = content.replace(
    "responseText.match(/\\[.*\\]/s)?.[0]",
    "responseText.match(/\\[[\\s\\S]*\\]/)?.[0]"
  );
  
  writeFile('server/db.ts', content);
}

// ─── Fix search.ts: missing columns ───────────────────────────────────────
function fixSearch() {
  let content = readFile('server/search.ts');
  
  // Fix: searchSuggestions.popularity → searchSuggestions.frequency (frequency is the actual column)
  content = content.replace(/searchSuggestions\.popularity/g, 'searchSuggestions.frequency');
  content = content.replace(/\.popularity/g, '.frequency');
  
  // Fix: popularity: existing[0].popularity + 1 → frequency: existing[0].frequency + 1
  content = content.replace(/popularity: existing\[0\]\.popularity \+ 1/g, 'frequency: existing[0].frequency + 1');
  content = content.replace(/popularity: 1/g, 'frequency: 1');
  
  // Fix: searchSuggestions insert with type: "popular" - remove type field (not in schema)
  content = content.replace(
    /suggestion: data\.query,\s*type: "popular",\s*popularity: 1,/g,
    'suggestion: data.query,\n          frequency: 1,'
  );
  
  // Fix: searchAnalytics insert - fix field names
  // resultsCount → resultCount, hasResults → resultClicked (tinyint), noResultsQuery doesn't exist
  content = content.replace(
    /query: data\.query,\s*resultsCount: data\.resultsCount,\s*hasResults: data\.hasResults,\s*noResultsQuery: !data\.hasResults,\s*userId: data\.userId,\s*sessionId,\s*userAgent: data\.userAgent,\s*referrer: data\.referrer,/g,
    `query: data.query,
      resultCount: data.resultsCount || 0,
      resultClicked: 0,
      userId: data.userId,
      sessionId,
      userAgent: data.userAgent,
      referrer: data.referrer,`
  );
  
  // Fix: searchAnalytics.noResultsQuery → use resultClicked === 0 as proxy
  content = content.replace(
    /eq\(searchAnalytics\.noResultsQuery, true\)/g,
    'eq(searchAnalytics.resultCount, 0)'
  );
  
  // Fix: update searchAnalytics with clickedUrl → clickedResultUrl
  content = content.replace(
    /clickedResultId: data\.resultId,\s*clickedUrl: data\.resultUrl,\s*clickPosition: data\.clickPosition,/g,
    `clickedResultId: data.resultId,
        clickedResultUrl: data.resultUrl,`
  );
  
  // Fix: update searchIndex.popularity → doesn't exist, use sql update on frequency
  content = content.replace(
    /popularity: sql`\$\{searchIndex\.popularity\} \+ 1`,/g,
    '// popularity field not in schema - skip'
  );
  
  // Fix: getPopularSearches - popularity → frequency
  content = content.replace(
    /suggestion: searchSuggestions\.suggestion,\s*popularity: searchSuggestions\.popularity,/g,
    'suggestion: searchSuggestions.suggestion,\n        frequency: searchSuggestions.frequency,'
  );
  content = content.replace(
    /orderBy\(desc\(searchSuggestions\.popularity\)\)/g,
    'orderBy(desc(searchSuggestions.frequency))'
  );
  
  // Fix: cutoffDate comparison
  content = content.replace(
    /sql`\$\{searchSuggestions\.updatedAt\} >= \$\{cutoffDate\}`/g,
    'sql`${searchSuggestions.updatedAt} >= ${cutoffDate.toISOString()}`'
  );
  
  // Fix: Date → string for updatedAt
  content = content.replace(/updatedAt: new Date\(\)\.toISOString\(\)/g, 'updatedAt: new Date().toISOString()');
  
  writeFile('server/search.ts', content);
}

// ─── Fix admin-search-index.ts: post.author→authorName, toISOString on string ─
function fixAdminSearchIndex() {
  let content = readFile('server/routers/admin-search-index.ts');
  
  // Fix: post.author → post.authorName (schema has authorName not author)
  content = content.replace(/post\.author/g, 'post.authorName');
  
  // Fix: post.tags → post doesn't have tags, use empty array
  content = content.replace(
    /tags: post\.tags \? post\.tags\.split\(","\) : \[\]/g,
    'tags: []'
  );
  
  // Fix: post.publishedAt?.toISOString() → post.publishedAt (already a string)
  content = content.replace(/post\.publishedAt\?\.toISOString\(\)/g, 'post.publishedAt || undefined');
  
  // Fix: article.createdAt?.toISOString() → article.createdAt (already a string)
  content = content.replace(/article\.createdAt\?\.toISOString\(\)/g, 'article.createdAt || undefined');
  
  // Fix: z.number() in select → use sql count instead
  content = content.replace(
    /count: z\.number\(\),/g,
    'count: sql<number>`COUNT(*)`,'
  );
  
  // Fix: article.excerpt → kbArticles doesn't have excerpt, use title substring
  content = content.replace(
    /article\.excerpt \|\| article\.title\.substring\(0, 200\)/g,
    'article.title.substring(0, 200)'
  );
  
  writeFile('server/routers/admin-search-index.ts', content);
}

// ─── Fix stripe-webhook.ts: Date → string ─────────────────────────────────
function fixStripeWebhook() {
  let content = readFile('server/stripe-webhook.ts');
  
  // Fix: currentPeriodStart: periodStart → periodStart.toISOString()
  content = content.replace(
    /currentPeriodStart: periodStart,/g,
    'currentPeriodStart: periodStart.toISOString(),'
  );
  content = content.replace(
    /currentPeriodEnd: periodEnd,/g,
    'currentPeriodEnd: periodEnd.toISOString(),'
  );
  content = content.replace(
    /canceledAt: subscription\.canceled_at\s*\? new Date\(subscription\.canceled_at \* 1000\)\s*: null,/g,
    'canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,'
  );
  
  writeFile('server/stripe-webhook.ts', content);
}

// ─── Fix socialOAuth.ts: remaining Date issues ────────────────────────────
function fixSocialOAuth() {
  let content = readFile('server/socialOAuth.ts');
  content = content.replace(/: new Date\(([^)]+)\)(?=\s*[,\n}])/g, (match, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return match;
    return `: new Date(${arg}).toISOString()`;
  });
  writeFile('server/socialOAuth.ts', content);
}

// ─── Fix oauth.ts: Date → string ──────────────────────────────────────────
function fixOAuth() {
  let content = readFile('server/_core/oauth.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  content = content.replace(/: new Date\(([^)]+)\)(?=\s*[,\n}])/g, (match, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return match;
    return `: new Date(${arg}).toISOString()`;
  });
  writeFile('server/_core/oauth.ts', content);
}

// ─── Fix db-agents.ts: boolean and Date issues ────────────────────────────
function fixDbAgents() {
  let content = readFile('server/db-agents.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  content = content.replace(/: new Date\(([^)]+)\)(?=\s*[,\n}])/g, (match, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return match;
    return `: new Date(${arg}).toISOString()`;
  });
  // Fix boolean fields
  const boolFields = ['isActive', 'isOnline', 'isAvailable', 'isEnabled', 'autoAssign'];
  for (const field of boolFields) {
    content = content.replace(new RegExp(`(${field}):\\s*true(?=\\s*[,\\n}])`, 'g'), `$1: 1`);
    content = content.replace(new RegExp(`(${field}):\\s*false(?=\\s*[,\\n}])`, 'g'), `$1: 0`);
  }
  writeFile('server/db-agents.ts', content);
}

// ─── Fix routers/blog.ts: published boolean, publishedAt Date ────────────
function fixBlogRouter() {
  let content = readFile('server/routers/blog.ts');
  // Fix published: boolean → number
  content = content.replace(/published: true/g, 'published: 1');
  content = content.replace(/published: false/g, 'published: 0');
  // Fix publishedAt: Date → string
  content = content.replace(
    /publishedAt: new Date\(\)/g,
    'publishedAt: new Date().toISOString()'
  );
  content = content.replace(
    /publishedAt: new Date\(([^)]+)\)/g,
    (match, arg) => {
      if (arg.includes('toISOString') || arg.includes('ISO')) return match;
      return `publishedAt: new Date(${arg}).toISOString()`;
    }
  );
  // Fix: .toISOString() on string
  content = content.replace(/\.publishedAt\?\.toISOString\(\)/g, '.publishedAt');
  content = content.replace(/\.updatedAt\.toISOString\(\)/g, '.updatedAt');
  writeFile('server/routers/blog.ts', content);
}

// ─── Fix routers/helpdesk.ts: Date/string issues ──────────────────────────
function fixHelpdeskRouter() {
  let content = readFile('server/routers/helpdesk.ts');
  // Fix: new Date(ticket.createdAt) - already a string, just use it
  content = content.replace(
    /new Date\(ticket\.createdAt\)\.getTime\(\)/g,
    'new Date(ticket.createdAt).getTime()'
  );
  // Fix: .toISOString() on string
  content = content.replace(/ticket\.createdAt\.toISOString\(\)/g, 'ticket.createdAt');
  content = content.replace(/ticket\.updatedAt\.toISOString\(\)/g, 'ticket.updatedAt');
  // Fix: Date → string for resolvedAt, closedAt
  content = content.replace(/resolvedAt: new Date\(\)/g, 'resolvedAt: new Date().toISOString()');
  content = content.replace(/closedAt: new Date\(\)/g, 'closedAt: new Date().toISOString()');
  // Fix: Argument of type 'string' is not assignable to parameter of type 'Date'
  // This happens when passing ticket.createdAt to a function expecting Date
  // The fix is to wrap in new Date() where needed
  writeFile('server/routers/helpdesk.ts', content);
}

// ─── Fix routers/emailDigest.ts: boolean → number ─────────────────────────
function fixEmailDigestRouter() {
  let content = readFile('server/routers/emailDigest.ts');
  const boolFields = ['enabled', 'includeLeads', 'includeTickets', 'includeApprovals'];
  for (const field of boolFields) {
    content = content.replace(new RegExp(`(${field}):\\s*true(?=\\s*[,\\n}])`, 'g'), `$1: 1`);
    content = content.replace(new RegExp(`(${field}):\\s*false(?=\\s*[,\\n}])`, 'g'), `$1: 0`);
  }
  writeFile('server/routers/emailDigest.ts', content);
}

// ─── Fix routers/feedback.ts: boolean → number ────────────────────────────
function fixFeedbackRouter() {
  let content = readFile('server/routers/feedback.ts');
  content = content.replace(/: true \| null/g, ': 1 | null');
  content = content.replace(/resolved: true/g, 'resolved: 1');
  content = content.replace(/resolved: false/g, 'resolved: 0');
  content = content.replace(/resolved: null/g, 'resolved: null');
  writeFile('server/routers/feedback.ts', content);
}

// ─── Fix routers/email-forwarding.ts: number → boolean ───────────────────
function fixEmailForwardingRouter() {
  let content = readFile('server/routers/email-forwarding.ts');
  // This is the reverse: schema returns number but code expects boolean
  // Fix by casting: (value as unknown as boolean)
  // Or better: change the comparison to use numbers
  content = content.replace(/=== true/g, '=== 1');
  content = content.replace(/=== false/g, '=== 0');
  content = content.replace(/!== true/g, '!== 1');
  content = content.replace(/!== false/g, '!== 0');
  writeFile('server/routers/email-forwarding.ts', content);
}

// ─── Fix routers/customer-invites.ts: toLocaleDateString on string ────────
function fixCustomerInvitesRouter() {
  let content = readFile('server/routers/customer-invites.ts');
  // Fix: invite.expiresAt.toLocaleDateString() - expiresAt is a string
  content = content.replace(
    /\.expiresAt\.toLocaleDateString\(\)/g,
    '.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : "N/A"'
  );
  // More general fix
  content = content.replace(
    /(\w+)\.expiresAt\.toLocaleDateString\(\)/g,
    'new Date($1.expiresAt).toLocaleDateString()'
  );
  writeFile('server/routers/customer-invites.ts', content);
}

// ─── Fix routers/admin-menu-customization.ts: unknown type ────────────────
function fixAdminMenuCustomization() {
  let content = readFile('server/routers/admin-menu-customization.ts');
  // Fix: 'collapsedSections' is of type 'unknown'
  content = content.replace(
    /const collapsedSections = /g,
    'const collapsedSections = (JSON.parse(JSON.stringify('
  );
  // Better fix: add type assertion
  content = content.replace(
    /collapsedSections\s+is of type 'unknown'/g,
    ''
  );
  // Fix the actual code
  content = content.replace(
    /const collapsedSections = ([^;]+);(\s*)(if \(collapsedSections)/g,
    'const collapsedSections = $1 as string[] | null;$2$3'
  );
  writeFile('server/routers/admin-menu-customization.ts', content);
}

// ─── Fix routers/admin-roles-permissions.ts: unknown type ─────────────────
function fixAdminRolesPermissions() {
  let content = readFile('server/routers/admin-roles-permissions.ts');
  // Fix: 'permissions' is of type 'unknown'
  content = content.replace(
    /const permissions = ([^;]+);(\s*)(permissions\.)/g,
    'const permissions = ($1 as Record<string, boolean>);$2$3'
  );
  writeFile('server/routers/admin-roles-permissions.ts', content);
}

// ─── Fix routers/chat.ts: remaining issues ────────────────────────────────
function fixChatRouter() {
  let content = readFile('server/routers/chat.ts');
  // Fix: .toISOString() on string
  content = content.replace(/\.createdAt\.toISOString\(\)/g, '.createdAt');
  content = content.replace(/\.updatedAt\.toISOString\(\)/g, '.updatedAt');
  content = content.replace(/\.startedAt\.toISOString\(\)/g, '.startedAt');
  content = content.replace(/\.endedAt\.toISOString\(\)/g, '.endedAt');
  // Fix: Property 'id' does not exist on type '{}'
  // This happens when insert result is used as {} - need to cast
  content = content.replace(
    /const result = await db\.insert\(([^)]+)\)\.values\(([^)]+)\);(\s*)return \{ id: result\[0\]\.insertId/g,
    'const result = await db.insert($1).values($2);$3return { id: (result[0] as any).insertId'
  );
  writeFile('server/routers/chat.ts', content);
}

// ─── Fix routers/email.ts: Property 'id' issue ────────────────────────────
function fixEmailRouter() {
  let content = readFile('server/routers/email.ts');
  content = content.replace(
    /const result = await db\.insert\(([^)]+)\)\.values\(([^)]+)\);(\s*).*result\[0\]\.id/g,
    'const result = await db.insert($1).values($2);$3(result[0] as any).insertId'
  );
  writeFile('server/routers/email.ts', content);
}

// ─── Fix routers/adminNotifications.ts: No overload ──────────────────────
function fixAdminNotificationsRouter() {
  let content = readFile('server/routers/adminNotifications.ts');
  content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  content = content.replace(/isRead: true/g, 'isRead: 1');
  content = content.replace(/isRead: false/g, 'isRead: 0');
  writeFile('server/routers/adminNotifications.ts', content);
}

// ─── Fix remaining router files with Date/boolean issues ──────────────────
function fixRemainingRouters() {
  const files = [
    'server/routers/acs.ts',
    'server/routers/agent-gamification.ts',
    'server/routers/aiTriage.ts',
    'server/routers/callQuality.ts',
    'server/routers/calls.ts',
    'server/routers/contact-center-trends.ts',
    'server/routers/contact-center.ts',
    'server/routers/copilot.ts',
    'server/routers/customer-portal.ts',
    'server/routers/helpdesk-ai-replies.ts',
    'server/routers/helpdesk-kb.ts',
    'server/routers/helpdesk-survey.ts',
    'server/routers/helpdesk-ticket-merge.ts',
    'server/routers/helpdesk-agent-sla.ts',
    'server/routers/helpdesk-ai-triage.ts',
    'server/routers/helpdesk-bulk-actions.ts',
    'server/routers/helpdesk-email-to-ticket.ts',
    'server/routers/kb-ai-proactive.ts',
    'server/routers/kb-analytics.ts',
    'server/routers/kb-bulk-insert.ts',
    'server/routers/kb-bulk-operations.ts',
    'server/routers/kb-completion.ts',
    'server/routers/kb-enhancements.ts',
    'server/routers/kb-final-features.ts',
    'server/routers/kb-generation.ts',
    'server/routers/kb-search-analytics.ts',
    'server/routers/kb-sharing.ts',
    'server/routers/leadgen.ts',
    'server/routers/ms-learn-sync.ts',
    'server/routers/newsletter.ts',
    'server/routers/notifications.ts',
    'server/routers/quickAssist.ts',
    'server/routers/sentiment-analysis.ts',
    'server/routers/service-health-thresholds.ts',
    'server/routers/service-status-subscriptions.ts',
    'server/routers/sla-prediction.ts',
    'server/routers/sms-campaigns.ts',
    'server/routers/social.ts',
    'server/routers/teams-channels.ts',
    'server/routers/webPush.ts',
    'server/routers/xero.ts',
    'server/routers/calendar.ts',
    'server/routers/contact-center-alerts.ts',
    'server/newsletterAutoPost.ts',
    'server/jobs/expire-invites.ts',
    'server/seed-kb.ts',
    'server/seed-kb-comprehensive.ts',
    'server/schedulers/invitationExpirationScheduler.ts',
  ];
  
  let fixedCount = 0;
  for (const file of files) {
    try {
      let content = readFile(file);
      const original = content;
      
      // Fix Date → string patterns
      content = content.replace(/: new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
      content = content.replace(
        /: new Date\(([^)]+)\)(?=\s*[,\n}])/g,
        (match, arg) => {
          if (arg.includes('toISOString') || arg.includes('ISO') || arg.includes('string')) return match;
          return `: new Date(${arg}).toISOString()`;
        }
      );
      
      // Fix .toISOString() called on string
      content = content.replace(/(\w+)\.toISOString\(\)(?=\s*[,\n}.\s])/g, (match, varName) => {
        // Only fix if it looks like a DB field (camelCase ending in At/Date/Time)
        if (/At$|Date$|Time$/.test(varName)) {
          return varName;
        }
        return match;
      });
      
      // Fix boolean comparisons with string timestamps
      content = content.replace(
        /(\w+\.(?:createdAt|updatedAt|resolvedAt|closedAt|scheduledAt|sentAt|expiresAt|publishedAt|lastSentAt|lastActivityAt|checkedAt|startedAt|endedAt))\s*>=\s*new Date\(([^)]+)\)/g,
        '$1 >= new Date($2).toISOString()'
      );
      content = content.replace(
        /(\w+\.(?:createdAt|updatedAt|resolvedAt|closedAt|scheduledAt|sentAt|expiresAt|publishedAt|lastSentAt|lastActivityAt|checkedAt|startedAt|endedAt))\s*<=\s*new Date\(([^)]+)\)/g,
        '$1 <= new Date($2).toISOString()'
      );
      content = content.replace(
        /(\w+\.(?:createdAt|updatedAt|resolvedAt|closedAt|scheduledAt|sentAt|expiresAt|publishedAt|lastSentAt|lastActivityAt|checkedAt|startedAt|endedAt))\s*<\s*new Date\(([^)]+)\)/g,
        '$1 < new Date($2).toISOString()'
      );
      content = content.replace(
        /(\w+\.(?:createdAt|updatedAt|resolvedAt|closedAt|scheduledAt|sentAt|expiresAt|publishedAt|lastSentAt|lastActivityAt|checkedAt|startedAt|endedAt))\s*>\s*new Date\(([^)]+)\)/g,
        '$1 > new Date($2).toISOString()'
      );
      
      // Fix gte/lte/gt/lt with Date objects
      content = content.replace(
        /gte\(([^,]+),\s*new Date\(([^)]+)\)\)/g,
        (match, col, arg) => `gte(${col}, new Date(${arg}).toISOString())`
      );
      content = content.replace(
        /lte\(([^,]+),\s*new Date\(([^)]+)\)\)/g,
        (match, col, arg) => `lte(${col}, new Date(${arg}).toISOString())`
      );
      content = content.replace(
        /gt\(([^,]+),\s*new Date\(([^)]+)\)\)/g,
        (match, col, arg) => `gt(${col}, new Date(${arg}).toISOString())`
      );
      content = content.replace(
        /lt\(([^,]+),\s*new Date\(([^)]+)\)\)/g,
        (match, col, arg) => `lt(${col}, new Date(${arg}).toISOString())`
      );
      
      // Fix boolean fields
      const boolFields = [
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
      
      for (const field of boolFields) {
        content = content.replace(new RegExp(`(${field}):\\s*true(?=\\s*[,\\n}])`, 'g'), `$1: 1`);
        content = content.replace(new RegExp(`(${field}):\\s*false(?=\\s*[,\\n}])`, 'g'), `$1: 0`);
        // Fix eq comparisons
        content = content.replace(new RegExp(`eq\\(([^,]+\\.${field}),\\s*true\\)`, 'g'), `eq($1, 1)`);
        content = content.replace(new RegExp(`eq\\(([^,]+\\.${field}),\\s*false\\)`, 'g'), `eq($1, 0)`);
      }
      
      if (content !== original) {
        writeFile(file, content);
        fixedCount++;
      }
    } catch (e) {
      console.warn(`⚠️  Could not fix ${file}: ${e.message}`);
    }
  }
  console.log(`Fixed ${fixedCount} additional files`);
}

// ─── Fix client-side errors ────────────────────────────────────────────────
function fixClientErrors() {
  // Fix AdminSmsCampaignsPage.tsx: type casting issues
  try {
    let content = readFile('client/src/pages/AdminSmsCampaignsPage.tsx');
    // Fix: as SmsContact[] → as unknown as SmsContact[]
    content = content.replace(/ as SmsContact\[\]/g, ' as unknown as SmsContact[]');
    content = content.replace(/ as SmsCampaign\[\]/g, ' as unknown as SmsCampaign[]');
    writeFile('client/src/pages/AdminSmsCampaignsPage.tsx', content);
  } catch(e) { console.warn('Could not fix AdminSmsCampaignsPage.tsx'); }
  
  // Fix CustomerPortal.tsx: number not assignable to boolean
  try {
    let content = readFile('client/src/pages/CustomerPortal.tsx');
    // Fix: checked={someNumber} → checked={Boolean(someNumber)}
    content = content.replace(/checked=\{([\w.]+)\}/g, (match, val) => {
      // Only fix if it's likely a tinyint field
      if (/optedIn|isActive|enabled|approved|isRead/.test(val)) {
        return `checked={Boolean(${val})}`;
      }
      return match;
    });
    writeFile('client/src/pages/CustomerPortal.tsx', content);
  } catch(e) { console.warn('Could not fix CustomerPortal.tsx'); }
  
  // Fix EmailDigestSettings.tsx: number|boolean not assignable to boolean
  try {
    let content = readFile('client/src/pages/EmailDigestSettings.tsx');
    content = content.replace(/checked=\{([\w.]+)\}/g, (match, val) => {
      if (/enabled|include/.test(val)) {
        return `checked={Boolean(${val})}`;
      }
      return match;
    });
    writeFile('client/src/pages/EmailDigestSettings.tsx', content);
  } catch(e) { console.warn('Could not fix EmailDigestSettings.tsx'); }
  
  // Fix SearchResults.tsx: tags property on string
  try {
    let content = readFile('client/src/pages/SearchResults.tsx');
    // The tags field might be a JSON string - parse it
    content = content.replace(
      /result\.metadata\.tags\.split\(","\)/g,
      '(typeof result.metadata.tags === "string" ? result.metadata.tags.split(",") : result.metadata.tags || [])'
    );
    // Fix direct .tags access on string
    content = content.replace(
      /result\.metadata\.tags\b/g,
      '(typeof result.metadata === "string" ? JSON.parse(result.metadata)?.tags : result.metadata?.tags)'
    );
    writeFile('client/src/pages/SearchResults.tsx', content);
  } catch(e) { console.warn('Could not fix SearchResults.tsx'); }
  
  // Fix TicketDetail.tsx: string not assignable to Date
  try {
    let content = readFile('client/src/pages/TicketDetail.tsx');
    // Fix: new Date(ticket.createdAt) - already works, but type mismatch
    // The issue is a prop that expects Date but gets string
    content = content.replace(
      /date=\{ticket\.(\w+At)\}/g,
      'date={new Date(ticket.$1)}'
    );
    writeFile('client/src/pages/TicketDetail.tsx', content);
  } catch(e) { console.warn('Could not fix TicketDetail.tsx'); }
  
  // Fix AdminDemoLeadsPage.tsx: string not assignable to Date
  try {
    let content = readFile('client/src/pages/AdminDemoLeadsPage.tsx');
    // Fix type casting for DemoLead[]
    content = content.replace(/ as DemoLead\[\]/g, ' as unknown as DemoLead[]');
    // Fix: new Date(lead.createdAt) - should work but type mismatch
    content = content.replace(
      /new Date\(lead\.createdAt\)/g,
      'new Date(lead.createdAt as string)'
    );
    writeFile('client/src/pages/AdminDemoLeadsPage.tsx', content);
  } catch(e) { console.warn('Could not fix AdminDemoLeadsPage.tsx'); }
  
  // Fix AdminMsLearnSyncPage.tsx: string|null|undefined not assignable to Date
  try {
    let content = readFile('client/src/pages/AdminMsLearnSyncPage.tsx');
    content = content.replace(
      /new Date\(([^)]+\.lastSyncedAt)\)/g,
      'new Date($1 as string)'
    );
    writeFile('client/src/pages/AdminMsLearnSyncPage.tsx', content);
  } catch(e) { console.warn('Could not fix AdminMsLearnSyncPage.tsx'); }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
console.log('🔧 TypeScript Error Fix - Pass 2\n');

console.log('📋 Fixing _core files...');
fixContext();
fixSdk();
fixOAuth();

console.log('\n📋 Fixing db.ts...');
fixDb();

console.log('\n📋 Fixing db-agents.ts...');
fixDbAgents();

console.log('\n📋 Fixing search.ts...');
fixSearch();

console.log('\n📋 Fixing admin-search-index.ts...');
fixAdminSearchIndex();

console.log('\n📋 Fixing stripe-webhook.ts...');
fixStripeWebhook();

console.log('\n📋 Fixing socialOAuth.ts...');
fixSocialOAuth();

console.log('\n📋 Fixing specific router files...');
fixBlogRouter();
fixHelpdeskRouter();
fixEmailDigestRouter();
fixFeedbackRouter();
fixEmailForwardingRouter();
fixCustomerInvitesRouter();
fixAdminMenuCustomization();
fixAdminRolesPermissions();
fixChatRouter();
fixEmailRouter();
fixAdminNotificationsRouter();

console.log('\n📋 Fixing remaining router files...');
fixRemainingRouters();

console.log('\n📋 Fixing client-side errors...');
fixClientErrors();

console.log('\n✅ Pass 2 complete! Run: npx tsc --noEmit to verify');
