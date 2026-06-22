# Voicemail Tombstone System - Production Deployment Guide

**Phase 7: Production Readiness Checklist**

## Overview

This document provides a comprehensive guide for deploying the Voicemail Tombstone System to production. The system prevents duplicate voicemail tickets from being re-imported by maintaining a persistent tombstone table of dismissed voicemails.

## System Architecture

### Components

1. **voicemailSourceTombstones Table** - Stores dismissed voicemail external IDs
2. **voicemailDedup Table** - Tracks processed voicemails with 24-hour expiration
3. **Email Poller** - Checks tombstones before importing voicemails
4. **Admin UI** - Delete Duplicates button in AdminCallReviewPage
5. **Cleanup Router** - tRPC procedures for duplicate management

### Data Flow

```
Incoming Voicemail Email
    ↓
Check voicemailSourceTombstones
    ↓
If found: Skip (return early)
If not found: Continue to dedup check
    ↓
Check voicemailDedup table
    ↓
If found: Skip (return early)
If not found: Create dedup entry + draft ticket
    ↓
Admin reviews in Call Review page
    ↓
Admin clicks "Delete Duplicates"
    ↓
System finds duplicates, creates tombstones
    ↓
Duplicates deleted from callDraftTickets
```

## Pre-Deployment Checklist

### Database Verification

- [ ] **voicemailSourceTombstones table exists**
  ```sql
  DESCRIBE voicemailSourceTombstones;
  ```
  Expected columns: `id`, `externalId`, `dismissedAt`, `reason`, `createdAt`

- [ ] **voicemailDedup table exists**
  ```sql
  DESCRIBE voicemailDedup;
  ```
  Expected columns: `id`, `externalId`, `expiresAt`, `createdAt`

- [ ] **UNIQUE constraint on voicemailDedup.externalId**
  ```sql
  SHOW INDEX FROM voicemailDedup;
  ```
  Should show UNIQUE index on `externalId`

- [ ] **callDraftTickets table has reviewStatus column**
  ```sql
  DESCRIBE callDraftTickets;
  ```
  Should include `reviewStatus` (enum: 'pending', 'approved', 'rejected')

### Code Verification

- [ ] **voicemail-cleanup.ts router exists and is registered**
  ```bash
  grep -n "voicemailCleanupRouter" server/routers.ts
  ```

- [ ] **findDuplicates and removeDuplicates procedures implemented**
  ```bash
  grep -n "findDuplicates\|removeDuplicates" server/routers/voicemail-cleanup.ts
  ```

- [ ] **AdminCallReviewPage has Delete Duplicates button**
  ```bash
  grep -n "Delete Duplicates" client/src/pages/AdminCallReviewPage.tsx
  ```

- [ ] **Email poller checks tombstones before importing**
  ```bash
  grep -n "voicemailSourceTombstones" server/_core/emailPoller.ts
  ```

- [ ] **All tests passing**
  ```bash
  pnpm test -- voicemail-cleanup.test.ts
  ```

### Environment Variables

- [ ] **DATABASE_URL configured** - MySQL/TiDB connection string
- [ ] **ADMIN_EMAILS configured** - Admin email addresses for access control
- [ ] **MS_GRAPH_CLIENT_ID configured** - For email polling
- [ ] **MS_GRAPH_CLIENT_SECRET configured** - For email polling
- [ ] **MS_GRAPH_TENANT_ID configured** - For email polling

## Deployment Steps

### Step 1: Pre-Migration Backup

```bash
# Backup callDraftTickets table
mysqldump -h $DB_HOST -u $DB_USER -p $DB_NAME callDraftTickets > callDraftTickets_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup voicemail-related tables
mysqldump -h $DB_HOST -u $DB_USER -p $DB_NAME voicemailSourceTombstones voicemailDedup > voicemail_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Data Migration

```bash
# Dry run (recommended first)
node scripts/migrate-voicemail-duplicates.mjs --dry-run --verbose

# Review output and verify correctness

# Execute migration
node scripts/migrate-voicemail-duplicates.mjs --verbose
```

Expected output:
```
✅ Database connection established
Found X groups of duplicate voicemails
✅ Created Y tombstone records
✅ Deleted Z duplicate tickets
✅ Migration completed successfully!
```

### Step 3: Verify Migration Results

```sql
-- Check tombstone count
SELECT COUNT(*) as tombstone_count FROM voicemailSourceTombstones;

-- Check remaining voicemail tickets
SELECT COUNT(*) as remaining_voicemails FROM callDraftTickets 
WHERE title LIKE '%Voicemail%' AND reviewStatus = 'pending';

-- Verify no more duplicates exist
SELECT COUNT(*) as duplicate_count FROM (
  SELECT title, description
  FROM callDraftTickets
  WHERE title LIKE '%Voicemail%' AND reviewStatus = 'pending'
  GROUP BY title, description
  HAVING COUNT(*) > 1
) as duplicates;
```

### Step 4: Deploy Code Changes

```bash
# Commit migration script and tests
git add scripts/migrate-voicemail-duplicates.mjs
git add server/routers/voicemail-cleanup.test.ts
git commit -m "Phase 6-7: Voicemail tombstone migration and tests"

# Push to production
git push origin main

# Deploy to production
# (Use your deployment process: webdev_save_checkpoint, Publish button, etc.)
```

### Step 5: Post-Deployment Verification

- [ ] **Admin portal loads without errors**
  - Navigate to `/admin/calls`
  - Verify "Delete Duplicates" button is visible

- [ ] **Email poller continues working**
  - Monitor logs for email polling activity
  - Verify new voicemails are imported correctly
  - Check that no new duplicates are created

- [ ] **Tombstone system prevents re-imports**
  - Manually test: create a voicemail, dismiss it
  - Verify it doesn't re-appear on next poll
  - Check that tombstone was created

- [ ] **Cleanup procedures work**
  - Create test duplicate tickets
  - Click "Delete Duplicates" button
  - Verify duplicates are removed and tombstones created

## Monitoring & Maintenance

### Daily Monitoring

```bash
# Check for new duplicate voicemails
SELECT COUNT(*) as duplicate_count FROM (
  SELECT title, description
  FROM callDraftTickets
  WHERE title LIKE '%Voicemail%' AND reviewStatus = 'pending'
  GROUP BY title, description
  HAVING COUNT(*) > 1
) as duplicates;

# Monitor email poller logs
tail -f /home/ubuntu/gigitekai/.manus-logs/devserver.log | grep -i "voicemail\|tombstone"

# Check dedup table health
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as active_entries,
  COUNT(CASE WHEN expiresAt <= NOW() THEN 1 END) as expired_entries
FROM voicemailDedup;
```

### Weekly Maintenance

```bash
# Clean up expired dedup entries
DELETE FROM voicemailDedup WHERE expiresAt <= NOW();

# Archive old tombstones (optional)
INSERT INTO voicemailSourceTombstones_archive 
SELECT * FROM voicemailSourceTombstones 
WHERE dismissedAt < DATE_SUB(NOW(), INTERVAL 30 DAYS);

DELETE FROM voicemailSourceTombstones 
WHERE dismissedAt < DATE_SUB(NOW(), INTERVAL 30 DAYS);
```

### Performance Metrics

Monitor these metrics to ensure system health:

1. **Duplicate Detection Rate**
   - Target: 0 new duplicates per day after deployment
   - Alert: > 5 new duplicates in 24 hours

2. **Tombstone Growth**
   - Expected: ~10-20 new tombstones per day
   - Alert: > 100 new tombstones per day (indicates problem)

3. **Email Poller Performance**
   - Expected: < 100ms per voicemail import
   - Alert: > 500ms per import (database performance issue)

4. **Dedup Table Size**
   - Expected: < 10,000 active entries
   - Alert: > 50,000 entries (cleanup not running)

## Rollback Plan

If issues occur after deployment:

### Option 1: Restore from Backup

```bash
# Stop email poller
# (Disable in emailPoller.ts or stop the service)

# Restore from backup
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < callDraftTickets_backup_YYYYMMDD_HHMMSS.sql

# Verify restoration
SELECT COUNT(*) FROM callDraftTickets WHERE title LIKE '%Voicemail%';

# Restart email poller
```

### Option 2: Disable Tombstone System

If tombstone system is causing issues:

```ts
// In emailPoller.ts, comment out tombstone check:
// const tombstone = await db.query(...);
// if (tombstone) return; // Skip if tombstoned

// System will revert to previous behavior
```

### Option 3: Revert Code Changes

```bash
# Revert to previous commit
git revert HEAD

# Deploy reverted code
```

## Success Criteria

The deployment is successful when:

1. ✅ **No new duplicate voicemails appear** in admin review queue after 48 hours
2. ✅ **Tombstone table grows** as admins dismiss voicemails
3. ✅ **Email poller performance** remains < 100ms per import
4. ✅ **Delete Duplicates button** removes duplicates correctly
5. ✅ **No errors** in application logs related to voicemail processing
6. ✅ **Admin users** can dismiss voicemails without issues
7. ✅ **New voicemails** are imported correctly on first receipt

## Troubleshooting

### Issue: "Delete Duplicates" button not working

**Solution:**
1. Verify `voicemailCleanupRouter` is registered in `server/routers.ts`
2. Check browser console for tRPC errors
3. Verify admin user has `role = 'admin'` in database
4. Check database connection in logs

### Issue: Duplicates keep reappearing

**Solution:**
1. Verify `voicemailSourceTombstones` table has data
2. Check email poller is checking tombstones before importing
3. Verify UNIQUE constraint exists on `voicemailDedup.externalId`
4. Run migration script again with `--verbose` flag

### Issue: Email poller is slow after deployment

**Solution:**
1. Check `voicemailSourceTombstones` table size (should be < 100k rows)
2. Verify indexes exist on `externalId` columns
3. Run `ANALYZE TABLE voicemailSourceTombstones` to update statistics
4. Check database server CPU/memory usage

### Issue: Tombstones not being created

**Solution:**
1. Verify `removeDuplicates` procedure is being called
2. Check admin user permissions (must have `role = 'admin'`)
3. Verify database connection is working
4. Check for errors in application logs

## Support & Escalation

If issues persist after troubleshooting:

1. **Check logs**: `/home/ubuntu/gigitekai/.manus-logs/devserver.log`
2. **Review database**: Run diagnostic queries above
3. **Contact admin**: Notify Harry (harry@gigitekai.com) of issues
4. **Escalate**: If critical, activate rollback plan

## Documentation

- [Voicemail Cleanup Router](./server/routers/voicemail-cleanup.ts) - Implementation details
- [Email Poller](./server/_core/emailPoller.ts) - Tombstone check integration
- [Admin Call Review Page](./client/src/pages/AdminCallReviewPage.tsx) - UI implementation
- [Test Suite](./server/routers/voicemail-cleanup.test.ts) - Comprehensive tests
- [Migration Script](./scripts/migrate-voicemail-duplicates.mjs) - Data migration tool

## Sign-Off

- [ ] **QA Lead**: Verified all tests passing
- [ ] **Database Admin**: Verified schema and backups
- [ ] **DevOps**: Verified deployment process
- [ ] **Product Owner**: Approved for production release

---

**Deployment Date**: ________________  
**Deployed By**: ________________  
**Verified By**: ________________  

**Status**: ☐ Pending | ☐ In Progress | ☐ Complete | ☐ Rolled Back
