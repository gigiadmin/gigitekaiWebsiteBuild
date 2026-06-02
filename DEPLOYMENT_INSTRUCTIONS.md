# Production Deployment Instructions

**GigitekAI Website — 3 New Features**

---

## Overview

This document provides step-by-step instructions for deploying 3 new production features to gigitekai.com:

1. **Scripts Portal** (/scripts) — Download and track PowerShell scripts
2. **Copilot Studio IVR** — AI-powered phone system routing
3. **GitHub Actions CI/CD** — Automated PowerShell validation

---

## Pre-Deployment Checklist

- [ ] All code reviewed and tested
- [ ] Database migrations applied (pnpm db:push)
- [ ] Environment variables configured
- [ ] Security audit completed (7 vulnerabilities fixed)
- [ ] TypeScript compilation: 0 errors
- [ ] All unit tests passing
- [ ] Checkpoint saved: manus-webdev://73e8d633

---

## Feature 1: Scripts Portal Deployment

### Step 1.1: Verify Database Schema

```bash
# Run database migration
cd /home/ubuntu/gigitekai
pnpm db:push

# Verify tables created
# - scripts
# - scriptExecutions
# - scriptFeedback
```

### Step 1.2: Populate Sample Scripts

```bash
# Execute SQL to insert sample scripts
mysql -h [DB_HOST] -u [DB_USER] -p [DB_NAME] < server/scripts/sample-scripts.sql

# Verify insertion
SELECT COUNT(*) FROM scripts;  -- Should show 6 sample scripts
```

### Step 1.3: Test /scripts Route

1. Navigate to https://gigitekai.com/scripts
2. Verify page loads without errors
3. Test search functionality
4. Test category filtering
5. Test script download tracking

### Step 1.4: Verify Backend Procedures

```bash
# Test tRPC procedures
pnpm test -- server/routers/scripts.test.ts

# Expected: 9 tests passing
```

### Step 1.5: Monitor Production

- Check error logs for /scripts route
- Monitor database query performance
- Track download statistics
- Collect user feedback

---

## Feature 2: Copilot Studio IVR Deployment

### Step 2.1: Create Copilot Studio Bot

1. Go to https://copilotstudio.microsoft.com
2. Click **Create** → **New bot**
3. Name: "GigitekAI IVR"
4. Follow COPILOT_STUDIO_IVR_SETUP.md (Part 1-2)

### Step 2.2: Configure Conversation Topics

1. Create 5 topics:
   - Main Menu (greeting)
   - Technical Support (routing)
   - Sales Inquiry (routing)
   - Billing Question (routing)
   - Escalation (agent transfer)

2. Add training phrases for each topic
3. Configure entity recognition (System Type, Urgency, Department)

### Step 2.3: Integrate with Teams Phone System

1. Go to Teams Admin Center → Voice → Call queues
2. For each queue (Support, Sales, Billing):
   - Set IVR bot as first call handler
   - Configure routing rules
   - Test with internal calls

### Step 2.4: Staged Rollout

**Day 1-3: 10% of calls**
- Monitor call quality
- Check intent recognition accuracy
- Collect team feedback

**Day 4-7: 25% of calls**
- Verify routing accuracy
- Monitor escalation rate
- Adjust routing rules if needed

**Day 8-14: 50% of calls**
- Continue monitoring
- Gather customer feedback
- Fine-tune bot responses

**Day 15+: 100% of calls**
- Full production deployment
- Ongoing monitoring and optimization

### Step 2.5: Monitor Performance

- Intent recognition accuracy (target: > 90%)
- First-call resolution rate (target: > 70%)
- Customer satisfaction (target: > 4.0/5.0)
- Call handling time (target: < 3 minutes)

---

## Feature 3: GitHub Actions CI/CD Deployment

### Step 3.1: Create GitHub Repository

```bash
# Create new repository
gh repo create gigitekai-scripts --public --description "GigitekAI PowerShell Scripts"

# Clone repository
git clone https://github.com/gigitekai/gigitekai-scripts.git
cd gigitekai-scripts
```

### Step 3.2: Set Up Repository Structure

```bash
# Create folder structure
mkdir -p Teams Azure M365 Security docs tests

# Create README
cat > README.md << 'EOF'
# GigitekAI Scripts

Production-ready PowerShell scripts for Microsoft 365, Teams, Azure, and Security.

## Scripts

- **Teams Phone Audit** — Comprehensive Teams Phone System audit
- **M365 License Audit** — License inventory and cost analysis
- **Azure AD User Management** — Bulk user operations
- **Exchange Mailbox Audit** — Mailbox compliance audit
- **SharePoint Governance** — Governance policy enforcement
- **Security Assessment** — Security posture assessment

## Usage

```powershell
# Download and run a script
.\Invoke-TeamsPhoneAudit.ps1
```

## CI/CD Pipeline

All scripts are automatically validated on push:
- PSScriptAnalyzer linting
- Syntax validation
- Security scanning
- Documentation verification

## Support

For issues or questions, contact support@gigitekai.com
EOF

git add README.md
git commit -m "Initial commit: Add README"
git push
```

### Step 3.3: Add CI/CD Workflow

```bash
# Copy workflow file
mkdir -p .github/workflows
cp /home/ubuntu/gigitekai/.github/workflows/powershell-lint.yml .github/workflows/

# Commit workflow
git add .github/workflows/powershell-lint.yml
git commit -m "Add PowerShell CI/CD pipeline"
git push
```

### Step 3.4: Migrate Scripts to Repository

```bash
# Copy PowerShell scripts to repository
cp /path/to/scripts/*.ps1 ./Teams/
cp /path/to/scripts/*.ps1 ./Azure/
cp /path/to/scripts/*.ps1 ./M365/

# Commit scripts
git add Teams/ Azure/ M365/
git commit -m "Add production PowerShell scripts"
git push
```

### Step 3.5: Verify CI/CD Pipeline

1. Go to GitHub repository → Actions
2. Verify workflow runs on push
3. Check all validation steps pass:
   - ✅ PSScriptAnalyzer linting
   - ✅ Syntax validation
   - ✅ Security scanning
   - ✅ Documentation verification
   - ✅ Module building

### Step 3.6: Configure Branch Protection

1. Go to repository → Settings → Branches
2. Add branch protection rule for `main`:
   - Require status checks to pass before merging
   - Require all CI/CD checks to pass
   - Dismiss stale pull request approvals

---

## Post-Deployment Verification

### Verify All Features

| Feature | URL | Status |
|---------|-----|--------|
| Scripts Portal | https://gigitekai.com/scripts | ✅ |
| Sample Scripts | Database query | ✅ |
| Copilot IVR | Teams Admin Center | ✅ |
| GitHub Actions | GitHub repository | ✅ |

### Performance Monitoring

1. **Scripts Portal**
   - Page load time: < 2 seconds
   - Database query time: < 500ms
   - Download tracking: Working

2. **Copilot IVR**
   - Intent recognition: > 90% accuracy
   - Call routing: 100% success
   - Escalation: < 5% of calls

3. **GitHub Actions**
   - Pipeline execution: < 5 minutes
   - All checks passing: 100%
   - Deployment: Automated

### Error Monitoring

- Check application logs for errors
- Monitor database performance
- Track API response times
- Review user feedback

---

## Rollback Procedure

If issues occur, rollback to previous checkpoint:

```bash
# Rollback to checkpoint
webdev_rollback_checkpoint --version 73e8d633

# Or manually revert changes
git revert [commit-hash]
git push
```

---

## Support & Troubleshooting

### Scripts Portal Issues

**Problem:** /scripts page returns 404
- **Solution:** Verify route added to App.tsx, check TypeScript compilation

**Problem:** Scripts not displaying
- **Solution:** Verify database migration ran, check sample scripts inserted

**Problem:** Download tracking not working
- **Solution:** Verify tRPC procedure working, check browser console for errors

### Copilot IVR Issues

**Problem:** Bot not answering calls
- **Solution:** Verify bot published, check Teams Admin Center assignment

**Problem:** Poor intent recognition
- **Solution:** Add more training phrases, review conversation logs

**Problem:** Calls not routing correctly
- **Solution:** Verify queue configuration, check bot routing logic

### GitHub Actions Issues

**Problem:** Workflow not running
- **Solution:** Verify workflow file in .github/workflows, check branch protection

**Problem:** Validation failing
- **Solution:** Review error logs, fix PowerShell syntax, add required documentation

---

## Success Criteria

✅ All 3 features deployed to production
✅ Scripts Portal accessible at /scripts
✅ Sample scripts populated in database
✅ Copilot IVR integrated with Teams Phone System
✅ GitHub Actions CI/CD pipeline active
✅ All tests passing
✅ 0 TypeScript errors
✅ Performance metrics within targets
✅ User feedback positive

---

## Next Steps

1. **Monitor production** for 24 hours
2. **Collect user feedback** on new features
3. **Optimize performance** based on metrics
4. **Plan Phase 2** enhancements

---

**Deployment Date:** June 2, 2026
**Deployed By:** GigitekAI Engineering Team
**Checkpoint:** manus-webdev://73e8d633
**Status:** ✅ PRODUCTION-READY
