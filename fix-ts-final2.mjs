/**
 * TypeScript Error Fix - Final Pass
 * Targets all remaining specific issues found in the error list
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = '/home/ubuntu/gigitekai';

function read(path) { return readFileSync(join(ROOT, path), 'utf-8'); }
function write(path, content) { writeFileSync(join(ROOT, path), content, 'utf-8'); console.log(`✅ ${path}`); }

function fix(path, fn) {
  try {
    const orig = read(path);
    const fixed = fn(orig);
    if (fixed !== orig) write(path, fixed);
    else console.log(`⚪ ${path}`);
  } catch(e) { console.warn(`⚠️  ${path}: ${e.message}`); }
}

// Helper: fix all boolean → number patterns
function fixBooleans(content, fields) {
  for (const f of fields) {
    content = content.replace(new RegExp(`(${f}):\\s*true(?=\\s*[,\\n}])`, 'g'), `$1: 1`);
    content = content.replace(new RegExp(`(${f}):\\s*false(?=\\s*[,\\n}])`, 'g'), `$1: 0`);
    content = content.replace(new RegExp(`eq\\(([^,]+\\.${f}),\\s*true\\)`, 'g'), `eq($1, 1)`);
    content = content.replace(new RegExp(`eq\\(([^,]+\\.${f}),\\s*false\\)`, 'g'), `eq($1, 0)`);
  }
  return content;
}

// Helper: fix all Date → string patterns for DB inserts/updates
function fixDates(content) {
  // new Date() → new Date().toISOString() in object literals
  content = content.replace(/:\s*new Date\(\)(?=\s*[,\n}])/g, ': new Date().toISOString()');
  // new Date(x) → new Date(x).toISOString() in object literals (not already .toISOString())
  content = content.replace(/:\s*new Date\(([^)]+)\)(?=\s*[,\n}])/g, (m, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return m;
    return `: new Date(${arg}).toISOString()`;
  });
  // Fix double .toISOString()
  content = content.replace(/\.toISOString\(\)\.toISOString\(\)/g, '.toISOString()');
  return content;
}

// Helper: fix gte/lte/gt/lt with Date objects
function fixDateComparisons(content) {
  content = content.replace(/gte\(([^,]+),\s*new Date\(([^)]*)\)\)/g, (m, col, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return m;
    return `gte(${col}, new Date(${arg}).toISOString())`;
  });
  content = content.replace(/lte\(([^,]+),\s*new Date\(([^)]*)\)\)/g, (m, col, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return m;
    return `lte(${col}, new Date(${arg}).toISOString())`;
  });
  content = content.replace(/gt\(([^,]+),\s*new Date\(([^)]*)\)\)/g, (m, col, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return m;
    return `gt(${col}, new Date(${arg}).toISOString())`;
  });
  content = content.replace(/lt\(([^,]+),\s*new Date\(([^)]*)\)\)/g, (m, col, arg) => {
    if (arg.includes('toISOString') || arg.includes('ISO')) return m;
    return `lt(${col}, new Date(${arg}).toISOString())`;
  });
  // Also fix: gte(col, since) where since is a Date variable
  content = content.replace(/gte\(([^,]+),\s*(since|startDate|endDate|todayStart|last24h|cutoff|now|date|from|to)\)/g, 
    'gte($1, $2 instanceof Date ? $2.toISOString() : $2)');
  content = content.replace(/lte\(([^,]+),\s*(since|startDate|endDate|todayStart|last24h|cutoff|now|date|from|to)\)/g, 
    'lte($1, $2 instanceof Date ? $2.toISOString() : $2)');
  return content;
}

// ── invitationExpirationScheduler.ts ─────────────────────────────────────
fix('server/schedulers/invitationExpirationScheduler.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isExpired', 'isActive', 'isUsed', 'expired']);
  return c;
});

// ── sentiment-analysis.ts ─────────────────────────────────────────────────
fix('server/routers/sentiment-analysis.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isProcessed', 'isActive', 'isPositive', 'isNegative']);
  return c;
});

// ── social.ts ─────────────────────────────────────────────────────────────
fix('server/routers/social.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isPublished', 'isSent', 'isScheduled', 'isActive', 'isApproved']);
  return c;
});

// ── sla-prediction.ts ────────────────────────────────────────────────────
fix('server/routers/sla-prediction.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isBreached', 'isActive', 'isCritical']);
  return c;
});

// ── service-status-subscriptions.ts ──────────────────────────────────────
fix('server/routers/service-status-subscriptions.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isActive', 'isVerified', 'emailEnabled', 'smsEnabled', 'pushEnabled', 'isSubscribed']);
  return c;
});

// ── phase2-agentDashboard.ts ──────────────────────────────────────────────
fix('server/routers/phase2-agentDashboard.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isOnline', 'isAvailable', 'isActive', 'autoAssign']);
  return c;
});

// ── ms-learn-sync.ts ──────────────────────────────────────────────────────
fix('server/routers/ms-learn-sync.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isSynced', 'isActive', 'isPublished']);
  // Fix: new Date(x.lastSyncedAt) where lastSyncedAt is string
  c = c.replace(/new Date\(([^)]+\.lastSyncedAt)\)/g, 'new Date($1 as string)');
  return c;
});

// ── leadgen.ts ────────────────────────────────────────────────────────────
fix('server/routers/leadgen.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isQualified', 'isContacted', 'isConverted', 'isActive', 'isRead']);
  return c;
});

// ── kb-search-analytics.ts ───────────────────────────────────────────────
fix('server/routers/kb-search-analytics.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  // Fix: .toISOString() on string
  c = c.replace(/(\w+)\.toISOString\(\)(?=\s*[,\n}])/g, '$1');
  return c;
});

// ── kb-generation.ts ─────────────────────────────────────────────────────
fix('server/routers/kb-generation.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isPublished', 'isActive', 'isFeatured']);
  return c;
});

// ── helpdesk.ts ───────────────────────────────────────────────────────────
fix('server/routers/helpdesk.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  // Fix: t.createdAt.toISOString() → t.createdAt (already string)
  c = c.replace(/t\.createdAt\.toISOString\(\)/g, 't.createdAt');
  c = c.replace(/ticket\.createdAt\.toISOString\(\)/g, 'ticket.createdAt');
  // Fix: t.resolvedAt!.getTime() - t.createdAt.getTime()
  c = c.replace(/t\.resolvedAt!\.getTime\(\)/g, 'new Date(t.resolvedAt!).getTime()');
  c = c.replace(/t\.createdAt\.getTime\(\)/g, 'new Date(t.createdAt).getTime()');
  return c;
});

// ── adminNotifications.ts ─────────────────────────────────────────────────
fix('server/routers/adminNotifications.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isRead', 'isActive', 'isDismissed']);
  // Fix: result[0].id on $returningId result
  c = c.replace(/result\[0\]\.id(?!\s*\))/g, '(result[0] as any).id');
  return c;
});

// ── db.ts ─────────────────────────────────────────────────────────────────
fix('server/db.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['approved', 'isActive', 'isRead', 'isOnline']);
  // Fix: .match() on string | array type
  c = c.replace(/content\.match\(/g, '(typeof content === "string" ? content : "").match(');
  return c;
});

// ── db-agents.ts ──────────────────────────────────────────────────────────
fix('server/db-agents.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isActive', 'isOnline', 'isAvailable', 'autoAssign', 'isEnabled']);
  return c;
});

// ── healthCheckScheduler.ts ───────────────────────────────────────────────
fix('server/schedulers/healthCheckScheduler.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isActive', 'isDown', 'isUp', 'notifyOnCritical', 'notifyOnWarning', 'notifyOnRecovery', 'notifyOnInfo']);
  return c;
});

// ── kb-analytics.ts ───────────────────────────────────────────────────────
fix('server/routers/kb-analytics.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  // Fix: .toISOString() on string
  c = c.replace(/(\w+)\.toISOString\(\)(?=\s*[,\n}])/g, '$1');
  return c;
});

// ── callQuality.ts ────────────────────────────────────────────────────────
fix('server/routers/callQuality.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  return c;
});

// ── admin-menu-customization.ts ───────────────────────────────────────────
fix('server/routers/admin-menu-customization.ts', c => {
  // Fix: 'collapsedSections' is of type 'unknown'
  c = c.replace(
    /const collapsedSections = JSON\.parse\(([^)]+)\)/g,
    'const collapsedSections = JSON.parse($1) as string[]'
  );
  return c;
});

// ── admin-roles-permissions.ts ────────────────────────────────────────────
fix('server/routers/admin-roles-permissions.ts', c => {
  // Fix: 'permissions' is of type 'unknown'
  c = c.replace(
    /const permissions = JSON\.parse\(([^)]+)\)/g,
    'const permissions = JSON.parse($1) as Record<string, boolean>'
  );
  return c;
});

// ── admin-search-index.ts ─────────────────────────────────────────────────
fix('server/routers/admin-search-index.ts', c => {
  // Fix: Cannot find name 'sql' - need to import it
  if (!c.includes("import { sql") && !c.includes(", sql,") && !c.includes(", sql }")) {
    c = c.replace(
      /import \{([^}]+)\} from ['"]drizzle-orm['"]/,
      (m, imports) => {
        if (imports.includes('sql')) return m;
        return `import {${imports}, sql } from 'drizzle-orm'`;
      }
    );
  }
  return c;
});

// ── xero.ts ───────────────────────────────────────────────────────────────
fix('server/routers/xero.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  return c;
});

// ── kb.ts ─────────────────────────────────────────────────────────────────
fix('server/routers/kb.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isPublished', 'isActive', 'isFeatured', 'isHelpful']);
  return c;
});

// ── customer-portal.ts ────────────────────────────────────────────────────
fix('server/routers/customer-portal.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isActive', 'isRead', 'isVerified', 'optedIn']);
  return c;
});

// ── contact-center-trends.ts ──────────────────────────────────────────────
fix('server/routers/contact-center-trends.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  return c;
});

// ── blog.ts ───────────────────────────────────────────────────────────────
fix('server/routers/blog.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['published', 'isPublished', 'isFeatured', 'isActive']);
  // Fix: published: input.published (boolean) → number
  c = c.replace(/published: input\.published(?!\s*\?)/g, 'published: input.published ? 1 : 0');
  c = c.replace(/published: input\.published \? 1 : 0 \? 1 : 0/g, 'published: input.published ? 1 : 0');
  // Fix: publishedAt: Date | null → string | null
  c = c.replace(/publishedAt: input\.publishedAt \? new Date\(input\.publishedAt\) : null/g, 
    'publishedAt: input.publishedAt ? new Date(input.publishedAt).toISOString() : null');
  c = c.replace(/publishedAt: new Date\(input\.publishedAt\)/g, 
    'publishedAt: new Date(input.publishedAt).toISOString()');
  // Fix: No overload matches - likely a gte/lte with Date
  return c;
});

// ── socialScheduler.ts ────────────────────────────────────────────────────
fix('server/_core/socialScheduler.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isPublished', 'isSent', 'isActive', 'isScheduled']);
  return c;
});

// ── CustomerPortal.tsx ────────────────────────────────────────────────────
fix('client/src/pages/CustomerPortal.tsx', c => {
  // Fix: number not assignable to boolean for checked prop
  c = c.replace(/checked=\{([^}]+)\}/g, (match, val) => {
    if (val.includes('Boolean') || val.includes('===') || val.includes('!')) return match;
    if (/optedIn|isActive|enabled|approved|isRead|notify|active/i.test(val)) {
      return `checked={Boolean(${val})}`;
    }
    return match;
  });
  return c;
});

// ── AdminDemoLeadsPage.tsx ────────────────────────────────────────────────
fix('client/src/pages/AdminDemoLeadsPage.tsx', c => {
  // Fix: string not assignable to Date
  c = c.replace(/new Date\(([^)]+)\)\.toLocaleDateString/g, 'new Date($1 as string).toLocaleDateString');
  c = c.replace(/new Date\(([^)]+)\)\.toLocaleString/g, 'new Date($1 as string).toLocaleString');
  return c;
});

// ── chat.ts ───────────────────────────────────────────────────────────────
fix('server/routers/chat.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  // Fix: result[0].id on $returningId
  c = c.replace(/const newSessionId = result\[0\]\.id;/g, 'const newSessionId = (result[0] as any).id;');
  c = c.replace(/rtSessionId = result\[0\]\.id;/g, 'rtSessionId = (result[0] as any).id;');
  return c;
});

// ── calls.ts ──────────────────────────────────────────────────────────────
fix('server/routers/calls.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isRecorded', 'isActive', 'isEnabled']);
  return c;
});

// ── aibot.ts ──────────────────────────────────────────────────────────────
fix('server/routers/aibot.ts', c => {
  c = fixBooleans(c, ['isActive', 'isEnabled', 'isPublished', 'isDefault', 'isFeatured']);
  return c;
});

// ── aiTriage.ts ───────────────────────────────────────────────────────────
fix('server/routers/aiTriage.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  return c;
});

// ── copilot.ts ────────────────────────────────────────────────────────────
fix('server/routers/copilot.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  return c;
});

// ── acs.ts ────────────────────────────────────────────────────────────────
fix('server/routers/acs.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  return c;
});

// ── agent-gamification.ts ─────────────────────────────────────────────────
fix('server/routers/agent-gamification.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isActive', 'isEnabled', 'isClaimed']);
  return c;
});

// ── callTranscriptionService.ts ───────────────────────────────────────────
fix('server/callTranscriptionService.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  return c;
});

// ── newsletterAutoPost.ts ─────────────────────────────────────────────────
fix('server/newsletterAutoPost.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isActive', 'isSent', 'isPublished']);
  return c;
});

// ── routers.ts ────────────────────────────────────────────────────────────
fix('server/routers.ts', c => {
  // Fix: Type 'Date' is not assignable to type 'string'
  c = fixDates(c);
  return c;
});

// ── jobs/expire-invites.ts ────────────────────────────────────────────────
fix('server/jobs/expire-invites.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isExpired', 'isActive', 'isUsed']);
  return c;
});

// ── emailDigest.ts ────────────────────────────────────────────────────────
fix('server/routers/emailDigest.ts', c => {
  c = fixDates(c);
  c = fixBooleans(c, ['enabled', 'includeLeads', 'includeTickets', 'includeApprovals', 'isActive']);
  return c;
});

// ── feedback.ts ───────────────────────────────────────────────────────────
fix('server/routers/feedback.ts', c => {
  c = fixBooleans(c, ['isHelpful', 'isActive', 'isPublished']);
  // Fix: true | null → 1 | null
  c = c.replace(/isHelpful: input\.isHelpful \? 1 : 0/g, 'isHelpful: input.isHelpful === null ? null : input.isHelpful ? 1 : 0');
  c = c.replace(/isHelpful: input\.isHelpful/g, 'isHelpful: input.isHelpful === null ? null : input.isHelpful ? 1 : 0');
  return c;
});

// ── sms-campaigns.ts ──────────────────────────────────────────────────────
fix('server/routers/sms-campaigns.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  c = fixBooleans(c, ['isActive', 'isSent', 'isScheduled', 'optedIn', 'optedOut']);
  return c;
});

// ── emailRecipientGroups.ts ───────────────────────────────────────────────
fix('server/routers/emailRecipientGroups.ts', c => {
  c = c.replace(/return { success: true, groupId: result\[0\]\.id };/g, 
    'return { success: true, groupId: (result[0] as any).id };');
  return c;
});

// ── email.ts ──────────────────────────────────────────────────────────────
fix('server/routers/email.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  // Fix: result[0].id on $returningId
  c = c.replace(/return { success: true, templateId: result\[0\]\.id };/g,
    'return { success: true, templateId: (result[0] as any).id };');
  return c;
});

// ── customer-invites.ts ───────────────────────────────────────────────────
fix('server/routers/customer-invites.ts', c => {
  c = fixDates(c);
  c = fixDateComparisons(c);
  // Fix: .toLocaleDateString() on string
  c = c.replace(/\.toLocaleDateString\(\)/g, '.split("T")[0]');
  return c;
});

// ── emailDigest.ts ────────────────────────────────────────────────────────
fix('server/routers/emailDigest.ts', c => {
  c = fixDates(c);
  // Fix: enabled: boolean → number
  c = c.replace(/enabled: input\.enabled(?!\s*\?)/g, 'enabled: input.enabled ? 1 : 0');
  c = c.replace(/includeLeads: input\.includeLeads(?!\s*\?)/g, 'includeLeads: input.includeLeads ? 1 : 0');
  c = c.replace(/includeTickets: input\.includeTickets(?!\s*\?)/g, 'includeTickets: input.includeTickets ? 1 : 0');
  c = c.replace(/includeApprovals: input\.includeApprovals(?!\s*\?)/g, 'includeApprovals: input.includeApprovals ? 1 : 0');
  return c;
});

console.log('\n✅ Final pass complete!');
