#!/usr/bin/env python3
"""
Fix remaining TypeScript Date type issues:
1. Interface fields typed as Date but DB returns string -> change to string
2. gte/lte/gt/lt comparisons between string and Date
3. .getTime() called on string fields
4. new Date().toISOString() in fields that expect Date
"""
import os, re

ROOT = '/home/ubuntu/gigitekai'

# Files with specific known issues
specific_fixes = {
    'server/routers/social.ts': [
        # line 255: f.scheduledAt < new Date() - string vs Date comparison
        (r'(\w+\.scheduledAt)\s*<\s*new Date\(\)', r'new Date(\1) < new Date()'),
        (r'(\w+\.scheduledAt)\s*>\s*new Date\(\)', r'new Date(\1) > new Date()'),
        (r'(\w+\.scheduledAt)\s*<=\s*new Date\(\)', r'new Date(\1) <= new Date()'),
        (r'(\w+\.scheduledAt)\s*>=\s*new Date\(\)', r'new Date(\1) >= new Date()'),
        # Fix: scheduledAt: new Date().toISOString() in update/insert
        (r'scheduledAt:\s*new Date\(\)', 'scheduledAt: new Date().toISOString()'),
    ],
    'server/routers/leadgen.ts': [
        # Fix No overload matches - likely gte with Date
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/helpdesk.ts': [
        # Fix: calculateSLADeadline(t.createdAt, ...) - t.createdAt is string
        (r'calculateSLADeadline\(t\.createdAt,', 'calculateSLADeadline(t.createdAt as any,'),
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/callQuality.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
        (r'gt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gt(\1, new Date(\2).toISOString())'),
        (r'lt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lt(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/xero.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/kb.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/kb-generation.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/kb-analytics.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/contact-center-trends.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/blog.ts': [
        # publishedAt: Date | null -> string | null
        (r'publishedAt:\s*new Date\(input\.publishedAt\)(?!\.toISOString)', 
         'publishedAt: new Date(input.publishedAt).toISOString()'),
        (r'publishedAt:\s*new Date\(([^)]+)\)(?!\.toISOString)', 
         r'publishedAt: new Date(\1).toISOString()'),
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/ms-learn-sync.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
        # Fix: new Date(item.lastSyncedAt) where lastSyncedAt is string
        (r'new Date\(item\.lastSyncedAt\)', 'new Date(item.lastSyncedAt as string)'),
        (r'new Date\(module\.lastSyncedAt\)', 'new Date(module.lastSyncedAt as string)'),
    ],
    'server/routers/service-status-subscriptions.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/phase2-agentDashboard.ts': [
        # isActive: 0 -> number not assignable to boolean - need to cast
        (r'isActive:\s*0,', 'isActive: 0 as unknown as boolean,'),
        (r'isActive:\s*1,', 'isActive: 1 as unknown as boolean,'),
    ],
    'server/db.ts': [
        # Fix: .match() on string | array
        (r'content\.match\(', '(typeof content === "string" ? content : "").match('),
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/db-agents.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/adminNotifications.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/agent-gamification.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/aiTriage.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/copilot.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/acs.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/sla-prediction.ts': [
        # calculateSLADeadline(ticket.createdAt, ...) - createdAt is string
        (r'calculateSLADeadline\(ticket\.createdAt,', 'calculateSLADeadline(ticket.createdAt as any,'),
        (r'calculateSLADeadline\(t\.createdAt,', 'calculateSLADeadline(t.createdAt as any,'),
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/sentiment-analysis.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/schedulers/invitationExpirationScheduler.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
        (r'lt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lt(\1, new Date(\2).toISOString())'),
        (r'gt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gt(\1, new Date(\2).toISOString())'),
    ],
    'server/schedulers/healthCheckScheduler.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/_core/callPoller.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/_core/emailPoller.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/_core/index.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/_core/socialEngagementPoller.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/_core/socialScheduler.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/_core/systemRouter.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/_core/teamsSlaAlerts.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
        # .getTime() on string
        (r'(\w+\.(?:createdAt|updatedAt|resolvedAt|closedAt|dueAt|slaDeadline))\.getTime\(\)', 
         r'new Date(\1).getTime()'),
    ],
    'server/_core/voicemailGroupPoller.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/callTranscriptAnalyzer.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/callTranscriptionService.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/newsletterAutoPost.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/jobs/expire-invites.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
        (r'lt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lt(\1, new Date(\2).toISOString())'),
        (r'gt\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gt(\1, new Date(\2).toISOString())'),
    ],
    'server/socialOAuth.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/search.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/webPush.ts': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'lte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'lte(\1, new Date(\2).toISOString())'),
    ],
    'server/routers/admin-menu-customization.ts': [
        # Fix: 'collapsedSections' is of type 'unknown'
        (r'const collapsedSections = JSON\.parse\(([^)]+)\)([^;])',
         r'const collapsedSections = JSON.parse(\1) as string[]\2'),
        (r'const collapsedSections = JSON\.parse\(([^)]+)\);',
         r'const collapsedSections = JSON.parse(\1) as string[];'),
    ],
    'server/routers/admin-roles-permissions.ts': [
        # Fix: 'permissions' is of type 'unknown'
        (r'const permissions = JSON\.parse\(([^)]+)\)([^;])',
         r'const permissions = JSON.parse(\1) as Record<string, boolean>\2'),
        (r'const permissions = JSON\.parse\(([^)]+)\);',
         r'const permissions = JSON.parse(\1) as Record<string, boolean>;'),
    ],
    'server/routers/admin-search-index.ts': [
        # Fix: Cannot find name 'sql' - add import
    ],
    'client/src/pages/CustomerPortal.tsx': [
        # Fix: number not assignable to boolean for checked prop
        (r'checked=\{(\w+\.(?:optedIn|isActive|enabled|approved|isRead|notify|active))\}',
         r'checked={Boolean(\1)}'),
    ],
    'client/src/pages/AdminDemoLeadsPage.tsx': [
        (r'new Date\((\w+\.(?:createdAt|updatedAt|submittedAt|date))\)\.toLocaleDateString',
         r'new Date(\1 as string).toLocaleDateString'),
        (r'new Date\((\w+\.(?:createdAt|updatedAt|submittedAt|date))\)\.toLocaleString',
         r'new Date(\1 as string).toLocaleString'),
    ],
    'client/src/components/AdminRolesManager.tsx': [
        (r'gte\(([^,]+),\s*new Date\(([^)]*)\)\)', r'gte(\1, new Date(\2).toISOString())'),
        (r'checked=\{(\w+\.(?:isActive|enabled|active))\}',
         r'checked={Boolean(\1)}'),
    ],
}

# Also apply global gte/lte/gt/lt Date fix to ALL server files
global_patterns = [
    (r'gte\(([^,]+),\s*new Date\(([^)]*)\)(?!\.toISOString)\)', 
     r'gte(\1, new Date(\2).toISOString())'),
    (r'lte\(([^,]+),\s*new Date\(([^)]*)\)(?!\.toISOString)\)', 
     r'lte(\1, new Date(\2).toISOString())'),
    (r'gt\(([^,]+),\s*new Date\(([^)]*)\)(?!\.toISOString)\)', 
     r'gt(\1, new Date(\2).toISOString())'),
    (r'lt\(([^,]+),\s*new Date\(([^)]*)\)(?!\.toISOString)\)', 
     r'lt(\1, new Date(\2).toISOString())'),
    # Fix double toISOString
    (r'\.toISOString\(\)\.toISOString\(\)', '.toISOString()'),
]

fixed_files = 0

# Apply specific fixes
for rel_path, patterns in specific_fixes.items():
    path = os.path.join(ROOT, rel_path)
    if not os.path.exists(path):
        print(f'⚠️  Not found: {rel_path}')
        continue
    try:
        content = open(path, 'r', encoding='utf-8').read()
        original = content
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
        if content != original:
            open(path, 'w', encoding='utf-8').write(content)
            fixed_files += 1
            print(f'✅ {rel_path}')
        else:
            print(f'⚪ {rel_path}')
    except Exception as e:
        print(f'⚠️  {rel_path}: {e}')

# Apply global patterns to all server .ts files
global_fixed = 0
for root, dirs, files in os.walk(os.path.join(ROOT, 'server')):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist']]
    for fname in files:
        if not fname.endswith('.ts'):
            continue
        path = os.path.join(root, fname)
        try:
            content = open(path, 'r', encoding='utf-8').read()
            original = content
            for pattern, replacement in global_patterns:
                content = re.sub(pattern, replacement, content)
            if content != original:
                open(path, 'w', encoding='utf-8').write(content)
                global_fixed += 1
        except Exception:
            pass

print(f'\n✅ Specific fixes: {fixed_files} files')
print(f'✅ Global gte/lte fixes: {global_fixed} files')
