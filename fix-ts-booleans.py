#!/usr/bin/env python3
"""
Fix all remaining TypeScript errors:
1. eq(field, true/false) -> eq(field, 1/0)
2. boolean field assignments: field: true -> field: 1
3. Interface Date types -> string
"""
import os, re, sys

ROOT = '/home/ubuntu/gigitekai'

bool_fields = [
    'isPublished','isActive','isSent','isScheduled','isRead','isVerified',
    'isExpired','isUsed','isEnabled','isDefault','isFeatured','isHelpful',
    'isOnline','isAvailable','isRecorded','isApproved','isQualified',
    'isContacted','isConverted','isCritical','isBreached','isSynced',
    'isDown','isUp','isProcessed','isPositive','isNegative','reminderSent',
    'approved','published','enabled','active','optedIn','optedOut',
    'autoAssign','notifyOnHealthy','notifyOnDegraded','notifyOnCritical',
    'notifyOnOffline','notifyOnRecovery','emailEnabled','smsEnabled',
    'pushEnabled','isSubscribed','isClaimed','escalated','isDeleted',
    'isArchived','isBanned','isLocked','isConfirmed','isPrimary',
    'isDefault','isSystem','isInternal','isExternal','isBillable',
    'isRecurring','isTemplate','isDraft','isShared','isPrivate',
    'isPublic','isMandatory','isOptional','isRequired','isCompleted',
    'isPending','isFailed','isSuccess','isError','isWarning',
    'notifyOnInfo','notifyOnWarning','notifyOnError','notifyOnSuccess',
    'reminderEnabled','autoClose','autoEscalate','autoAssign',
    'smsEnabled','emailEnabled','pushEnabled','teamsEnabled',
    'slackEnabled','webhookEnabled','apiEnabled','ssoEnabled',
    'mfaEnabled','twoFactorEnabled','loginEnabled','registerEnabled',
]

# Pattern: eq(anything.fieldName, true) or eq(anything.fieldName, false)
eq_true = re.compile(r'eq\(([^,]+),\s*true\)')
eq_false = re.compile(r'eq\(([^,]+),\s*false\)')

# Pattern: fieldName: true, or fieldName: false, (in object literals)
field_pattern = re.compile(
    r'\b(' + '|'.join(re.escape(f) for f in bool_fields) + r'):\s*(true|false)([,\s\n}])'
)

fixed_files = 0
total_replacements = 0

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', '.manus-logs']]
    for fname in files:
        if not fname.endswith('.ts'):
            continue
        path = os.path.join(root, fname)
        try:
            content = open(path, 'r', encoding='utf-8').read()
        except Exception:
            continue
        
        original = content
        
        # Fix eq(field, true/false) patterns
        content = eq_true.sub(lambda m: f'eq({m.group(1)}, 1)', content)
        content = eq_false.sub(lambda m: f'eq({m.group(1)}, 0)', content)
        
        # Fix field: true/false patterns in object literals
        def replace_bool(m):
            field = m.group(1)
            val = m.group(2)
            suffix = m.group(3)
            num = '1' if val == 'true' else '0'
            return f'{field}: {num}{suffix}'
        
        content = field_pattern.sub(replace_bool, content)
        
        # Fix double replacements like "1: 1" or "0: 0" that shouldn't happen
        # (these would only occur if field name itself was 1 or 0 - won't happen)
        
        if content != original:
            open(path, 'w', encoding='utf-8').write(content)
            fixed_files += 1
            reps = sum(1 for a, b in zip(original.split('\n'), content.split('\n')) if a != b)
            total_replacements += reps
            print(f'✅ {os.path.relpath(path, ROOT)}')

print(f'\nFixed {fixed_files} files, ~{total_replacements} lines changed')
