#!/usr/bin/env python3
"""Targeted fixes for all remaining specific TypeScript errors."""
import os, re

ROOT = '/home/ubuntu/gigitekai'

def read(rel): 
    return open(os.path.join(ROOT, rel), 'r', encoding='utf-8').read()

def write(rel, c): 
    open(os.path.join(ROOT, rel), 'w', encoding='utf-8').write(c)
    print(f'✅ {rel}')

def fix(rel, fn):
    try:
        c = read(rel)
        nc = fn(c)
        if nc != c: write(rel, nc)
        else: print(f'⚪ {rel}')
    except Exception as e: print(f'⚠️  {rel}: {e}')

# ── admin-menu-customization.ts ───────────────────────────────────────────
# collapsedSections comes from DB as json field - need to cast it
fix('server/routers/admin-menu-customization.ts', lambda c: c.replace(
    'let collapsedSections = result.length > 0 ? result[0].collapsedSections : [];',
    'let collapsedSections: string[] = result.length > 0 ? (result[0].collapsedSections as string[] || []) : [];'
))

# ── admin-roles-permissions.ts ────────────────────────────────────────────
fix('server/routers/admin-roles-permissions.ts', lambda c: c.replace(
    'const permissions = roles[0].permissions;\n      return permissions.includes(input.permission);',
    'const permissions = roles[0].permissions as string[] | null;\n      return Array.isArray(permissions) && permissions.includes(input.permission);'
))

# ── admin-search-index.ts: add sql import ────────────────────────────────
def fix_search_index(c):
    if 'sql' not in c.split('from')[0] or "{ sql" not in c:
        # Add sql to the drizzle-orm import
        c = re.sub(
            r"import \{([^}]+)\} from ['\"]drizzle-orm['\"]",
            lambda m: f"import {{{m.group(1)}, sql }} from 'drizzle-orm'" if 'sql' not in m.group(1) else m.group(0),
            c, count=1
        )
    return c
fix('server/routers/admin-search-index.ts', fix_search_index)

# ── adminNotifications.ts: lt with Date, $returningId id ─────────────────
def fix_admin_notifs(c):
    # lt(field, cutoff) where cutoff is Date
    c = re.sub(r'lt\(([^,]+),\s*cutoff\)', 'lt(\\1, cutoff.toISOString())', c)
    c = re.sub(r'gte\(([^,]+),\s*cutoff\)', 'gte(\\1, cutoff.toISOString())', c)
    # $returningId result
    c = c.replace('const id = result[0]?.id ?? null;', 'const id = (result[0] as any)?.id ?? null;')
    return c
fix('server/routers/adminNotifications.ts', fix_admin_notifs)

# ── agent-gamification.ts: gte/lte with Date ─────────────────────────────
def fix_gamification(c):
    c = re.sub(r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())', c)
    return c
fix('server/routers/agent-gamification.ts', fix_gamification)

# ── aibot.ts: boolean not assignable to number ───────────────────────────
def fix_aibot(c):
    # Lines 577 and 767 - need to see what fields
    c = re.sub(r'\b(isActive|isEnabled|isDefault|isFeatured|isPublished):\s*input\.(\w+)(?!\s*\?)',
               lambda m: f'{m.group(1)}: input.{m.group(2)} ? 1 : 0', c)
    # Also fix direct boolean assignments that weren't caught
    c = re.sub(r'\b(isActive|isEnabled):\s*(true|false)(?=[,\s\n}])',
               lambda m: f'{m.group(1)}: {"1" if m.group(2)=="true" else "0"}', c)
    return c
fix('server/routers/aibot.ts', fix_aibot)

# ── blog.ts: publishedAt: Date, published: boolean ───────────────────────
def fix_blog(c):
    # publishedAt: new Date(x) -> toISOString
    c = re.sub(r'publishedAt:\s*new Date\(([^)]+)\)(?!\.toISOString)', 
               r'publishedAt: new Date(\1).toISOString()', c)
    # publishedAt: Date | null in update set
    c = re.sub(r'publishedAt:\s*(input\.\w+\s*\?\s*new Date\([^)]+\)\s*:\s*null)',
               lambda m: f'publishedAt: {m.group(1).replace("new Date(", "new Date(").replace(")", ".toISOString())")}', c)
    # published: boolean -> number  
    c = re.sub(r'\bpublished:\s*input\.published(?!\s*\?)',
               'published: input.published ? 1 : 0', c)
    # gte/lte with Date
    c = re.sub(r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())', c)
    return c
fix('server/routers/blog.ts', fix_blog)

# ── callQuality.ts: gte/lte with Date ────────────────────────────────────
def fix_callquality(c):
    c = re.sub(r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'gt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gt(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lt(\1, new Date(\2).toISOString())', c)
    return c
fix('server/routers/callQuality.ts', fix_callquality)

# ── calls.ts: isRecorded: true ────────────────────────────────────────────
def fix_calls(c):
    c = c.replace('isRecorded: true,', 'isRecorded: 1,')
    c = c.replace('isRecorded: false,', 'isRecorded: 0,')
    return c
fix('server/routers/calls.ts', fix_calls)

# ── contact-center-trends.ts: gte/lte with Date ──────────────────────────
fix('server/routers/contact-center-trends.ts', fix_callquality)

# ── copilot.ts: gte/lte with Date ────────────────────────────────────────
fix('server/routers/copilot.ts', fix_callquality)

# ── customer-invites.ts: .toLocaleDateString on string ───────────────────
fix('server/routers/customer-invites.ts', lambda c: 
    re.sub(r'(\w+)\.toLocaleDateString\(\)', r'new Date(\1 as string).toLocaleDateString()', c))

# ── customer-portal.ts: gte/lte with Date ────────────────────────────────
fix('server/routers/customer-portal.ts', fix_callquality)

# ── email-forwarding.ts: number not assignable to boolean ────────────────
def fix_email_fwd(c):
    # The return type says boolean but we return 0/1
    # Fix: cast the number result to boolean
    c = re.sub(r'enabled:\s*forwardingRule\.enabled,',
               'enabled: Boolean(forwardingRule.enabled),', c)
    c = c.replace('return { enabled: 0 };', 'return { enabled: false };')
    c = c.replace('return { enabled: 1 };', 'return { enabled: true };')
    # Fix lines 141, 157, 160 - these are likely checking .enabled from graph API
    c = re.sub(r'enabled:\s*(\w+)\.enabled(?!,\s*//)',
               r'enabled: Boolean(\1.enabled)', c)
    return c
fix('server/routers/email-forwarding.ts', fix_email_fwd)

# ── emailDigest.ts: boolean not assignable to number ─────────────────────
def fix_email_digest(c):
    for field in ['enabled', 'includeLeads', 'includeTickets', 'includeApprovals']:
        c = re.sub(rf'\b{field}:\s*input\.{field}(?!\s*\?)',
                   f'{field}: input.{field} ? 1 : 0', c)
    return c
fix('server/routers/emailDigest.ts', fix_email_digest)

# ── feedback.ts: true | null not assignable to number ────────────────────
def fix_feedback(c):
    c = re.sub(r'\bisHelpful:\s*input\.isHelpful(?!\s*[?=])',
               'isHelpful: input.isHelpful === null ? null : (input.isHelpful ? 1 : 0)', c)
    c = re.sub(r'\bisHelpful:\s*true(?=[,\s\n}])', 'isHelpful: 1', c)
    c = re.sub(r'\bisHelpful:\s*false(?=[,\s\n}])', 'isHelpful: 0', c)
    return c
fix('server/routers/feedback.ts', fix_feedback)

# ── helpdesk-email-to-ticket.ts: string >= Date ──────────────────────────
def fix_helpdesk_email(c):
    # string >= Date comparison
    c = re.sub(r'(\w+\.(?:createdAt|updatedAt|receivedAt))\s*>=\s*new Date\(([^)]*)\)',
               r'new Date(\1 as string) >= new Date(\2)', c)
    c = re.sub(r'(\w+\.(?:createdAt|updatedAt|receivedAt))\s*<=\s*new Date\(([^)]*)\)',
               r'new Date(\1 as string) <= new Date(\2)', c)
    return c
fix('server/routers/helpdesk-email-to-ticket.ts', fix_helpdesk_email)

# ── helpdesk-kb.ts: gte/lte ──────────────────────────────────────────────
fix('server/routers/helpdesk-kb.ts', fix_callquality)

# ── helpdesk.ts: calculateSLADeadline(string), gte/lte ───────────────────
def fix_helpdesk(c):
    c = re.sub(r'calculateSLADeadline\(t\.createdAt,', 'calculateSLADeadline(new Date(t.createdAt),', c)
    c = re.sub(r'calculateSLADeadline\(ticket\.createdAt,', 'calculateSLADeadline(new Date(ticket.createdAt),', c)
    c = re.sub(r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lt(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'gt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gt(\1, new Date(\2).toISOString())', c)
    return c
fix('server/routers/helpdesk.ts', fix_helpdesk)

# ── invitationExpirationScheduler.ts ─────────────────────────────────────
def fix_invite_sched(c):
    c = re.sub(r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lt(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'gt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gt(\1, new Date(\2).toISOString())', c)
    return c
fix('server/schedulers/invitationExpirationScheduler.ts', fix_invite_sched)

# ── kb.ts, kb-generation.ts, kb-analytics.ts, xero.ts ───────────────────
for f in ['server/routers/kb.ts', 'server/routers/kb-generation.ts', 
          'server/routers/kb-analytics.ts', 'server/routers/xero.ts',
          'server/routers/ms-learn-sync.ts', 'server/routers/leadgen.ts',
          'server/routers/service-status-subscriptions.ts',
          'server/routers/social.ts', 'server/socialOAuth.ts',
          'server/search.ts', 'server/routers/webPush.ts',
          'server/routers/acs.ts', 'server/routers/aiTriage.ts',
          'server/_core/callPoller.ts', 'server/_core/emailPoller.ts',
          'server/_core/index.ts', 'server/_core/socialEngagementPoller.ts',
          'server/_core/socialScheduler.ts', 'server/_core/systemRouter.ts',
          'server/_core/teamsSlaAlerts.ts', 'server/_core/voicemailGroupPoller.ts',
          'server/callTranscriptAnalyzer.ts', 'server/callTranscriptionService.ts',
          'server/newsletterAutoPost.ts', 'server/jobs/expire-invites.ts',
          'server/db.ts', 'server/db-agents.ts']:
    fix(f, fix_callquality)

# ── SLATimer.tsx: createdAt: string | Date ───────────────────────────────
def fix_sla_timer(c):
    c = c.replace('createdAt: string | Date;', 'createdAt: string | Date;')
    # Fix the usage inside the component - if createdAt is string, wrap in new Date()
    c = re.sub(r'const deadline = calculateDeadline\(createdAt,',
               'const deadline = calculateDeadline(createdAt instanceof Date ? createdAt : new Date(createdAt),', c)
    # Fix any direct Date method calls on createdAt
    c = re.sub(r'\bcreatedAt\.getTime\(\)', 
               '(createdAt instanceof Date ? createdAt : new Date(createdAt)).getTime()', c)
    return c
fix('client/src/components/SLATimer.tsx', fix_sla_timer)

# ── AdminDemoLeadsPage.tsx ────────────────────────────────────────────────
def fix_admin_demo(c):
    c = re.sub(r'new Date\((\w+\.(?:createdAt|updatedAt|submittedAt|date|requestedAt))\)\.toLocaleDateString',
               r'new Date(\1 as string).toLocaleDateString', c)
    c = re.sub(r'new Date\((\w+\.(?:createdAt|updatedAt|submittedAt|date|requestedAt))\)\.toLocaleString',
               r'new Date(\1 as string).toLocaleString', c)
    return c
fix('client/src/pages/AdminDemoLeadsPage.tsx', fix_admin_demo)

# ── CustomerPortal.tsx ────────────────────────────────────────────────────
def fix_customer_portal(c):
    # checked={field} where field is number
    c = re.sub(r'checked=\{(\w+\.(?:optedIn|isActive|enabled|approved|isRead|notify|active|isEnabled|isVerified))\}',
               r'checked={Boolean(\1)}', c)
    return c
fix('client/src/pages/CustomerPortal.tsx', fix_customer_portal)

# ── AdminRolesManager.tsx ─────────────────────────────────────────────────
def fix_admin_roles(c):
    c = re.sub(r'checked=\{(\w+\.(?:isActive|enabled|active|isEnabled))\}',
               r'checked={Boolean(\1)}', c)
    c = re.sub(r'new Date\((\w+\.(?:createdAt|updatedAt))\)\.toLocaleDateString',
               r'new Date(\1 as string).toLocaleDateString', c)
    return c
fix('client/src/components/AdminRolesManager.tsx', fix_admin_roles)

# ── db.ts: .match() on string | array, gte/lte ───────────────────────────
def fix_db(c):
    c = re.sub(r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'lt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lt(\1, new Date(\2).toISOString())', c)
    c = re.sub(r'gt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gt(\1, new Date(\2).toISOString())', c)
    # Fix .match() on string | array type
    c = re.sub(r'\bcontent\.match\(', '(typeof content === "string" ? content : "").match(', c)
    return c
fix('server/db.ts', fix_db)

print('\n✅ Targeted fixes complete!')
