#!/bin/bash
cd /home/ubuntu/gigitekai

fix_file() {
  local f="$1"
  shift
  if [ -f "$f" ]; then
    sed -i "$@" "$f" && echo "✅ $f"
  fi
}

# ── contact-center-alerts.ts: interface uses Date, DB returns string ──────
# Lines 22-25: interface fields typed as Date
sed -n '18,30p' server/routers/contact-center-alerts.ts
fix_file server/routers/contact-center-alerts.ts \
  -e 's/startTime: Date;/startTime: string;/g' \
  -e 's/endTime: Date | null;/endTime: string | null;/g' \
  -e 's/resolvedAt: Date | null;/resolvedAt: string | null;/g' \
  -e 's/createdAt: Date;/createdAt: string;/g' \
  -e 's/updatedAt: Date;/updatedAt: string;/g' \
  -e 's/lastTriggered: Date | null;/lastTriggered: string | null;/g' \
  -e 's/triggeredAt: Date;/triggeredAt: string;/g'

# ── contact-center-trends.ts: gte with Date ───────────────────────────────
fix_file server/routers/contact-center-trends.ts \
  -e 's/gte(\([^,]*\), new Date(\([^)]*\)))/gte(\1, new Date(\2).toISOString())/g'

# ── calls.ts: isRecorded: true ────────────────────────────────────────────
fix_file server/routers/calls.ts \
  -e 's/isRecorded: true/isRecorded: 1/g' \
  -e 's/isRecorded: false/isRecorded: 0/g'

# ── aibot.ts: boolean fields ──────────────────────────────────────────────
fix_file server/routers/aibot.ts \
  -e 's/isActive: true/isActive: 1/g' \
  -e 's/isActive: false/isActive: 0/g' \
  -e 's/isEnabled: true/isEnabled: 1/g' \
  -e 's/isEnabled: false/isEnabled: 0/g' \
  -e 's/isPublished: true/isPublished: 1/g' \
  -e 's/isPublished: false/isPublished: 0/g'

# ── aiTriage.ts: gte with Date ────────────────────────────────────────────
fix_file server/routers/aiTriage.ts \
  -e 's/gte(\([^,]*\), new Date(\([^)]*\)))/gte(\1, new Date(\2).toISOString())/g'

# ── copilot.ts: gte with Date ─────────────────────────────────────────────
fix_file server/routers/copilot.ts \
  -e 's/gte(\([^,]*\), new Date(\([^)]*\)))/gte(\1, new Date(\2).toISOString())/g'

# ── customer-invites.ts: .toLocaleDateString on string ────────────────────
fix_file server/routers/customer-invites.ts \
  -e 's/\.toLocaleDateString()/\.split("T")[0]/g'

# ── email.ts: Property 'id' does not exist ────────────────────────────────
# This is the $returningId() pattern - fix by casting
sed -n '244,250p' server/routers/email.ts
sed -n '429,435p' server/routers/email.ts

# ── emailDigest.ts: boolean not assignable to number ─────────────────────
fix_file server/routers/emailDigest.ts \
  -e 's/enabled: input\.enabled/enabled: input.enabled ? 1 : 0/g' \
  -e 's/includeLeads: input\.includeLeads/includeLeads: input.includeLeads ? 1 : 0/g' \
  -e 's/includeTickets: input\.includeTickets/includeTickets: input.includeTickets ? 1 : 0/g' \
  -e 's/includeApprovals: input\.includeApprovals/includeApprovals: input.includeApprovals ? 1 : 0/g'

# ── emailRecipientGroups.ts: Property 'id' does not exist ────────────────
sed -n '37,45p' server/routers/emailRecipientGroups.ts

# ── feedback.ts: true | null not assignable to number ────────────────────
fix_file server/routers/feedback.ts \
  -e 's/isHelpful: true/isHelpful: 1/g' \
  -e 's/isHelpful: false/isHelpful: 0/g' \
  -e 's/isHelpful: null/isHelpful: null/g'

# ── email-forwarding.ts: number not assignable to boolean ────────────────
# The return type expects boolean but DB returns number
sed -n '120,165p' server/routers/email-forwarding.ts

echo "Done"
