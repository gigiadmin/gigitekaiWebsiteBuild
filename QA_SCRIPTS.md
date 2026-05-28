# QA Testing Scripts

Add these scripts to your `package.json` for easy QA testing:

```json
{
  "scripts": {
    "test:qa": "tsx server/qa-test-runner.ts",
    "test:qa:prod": "TEST_URL=https://gigitekai.com tsx server/qa-test-runner.ts",
    "test:qa:dev": "TEST_URL=http://localhost:3000 tsx server/qa-test-runner.ts",
    "test:links": "npm run test:qa -- --links-only",
    "test:forms": "npm run test:qa -- --forms-only",
    "test:pages": "npm run test:qa -- --pages-only"
  }
}
```

## Running Tests

### Full QA Suite
```bash
# Test dev server
pnpm test:qa:dev

# Test production
pnpm test:qa:prod
```

### Specific Test Types
```bash
# Test only links
pnpm test:links

# Test only forms
pnpm test:forms

# Test only page loads
pnpm test:pages
```

## Manual Testing Checklist

### Daily Testing (5 minutes)
1. Homepage loads
2. Contact form works
3. Support portal works
4. One admin function works

### Weekly Testing (30 minutes)
1. Run full automated test suite
2. Test all major forms
3. Test all navigation links
4. Test mobile responsiveness
5. Check email notifications

### Monthly Comprehensive (2 hours)
1. Run full automated test suite
2. Test every form manually
3. Test every link manually
4. Test on multiple devices
5. Test on multiple browsers
6. Verify all CTAs work
7. Check analytics tracking
8. Verify email notifications
9. Test admin portal thoroughly
10. Document any issues

## Issue Reporting

When you find an issue, create an entry in `QA_ISSUES.md`:

```markdown
- [ ] **Issue Title**
  - URL: [page URL]
  - Issue: [description]
  - Root Cause: [if known]
  - Status: [INVESTIGATING/IN PROGRESS/FIXED/BLOCKED]
  - Priority: [CRITICAL/HIGH/MEDIUM/LOW]
```

## Continuous Integration

For CI/CD pipelines, add to your workflow:

```yaml
- name: Run QA Tests
  run: pnpm test:qa:prod
  
- name: Upload QA Report
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: qa-test-report
    path: qa-test-report-*.json
```

## Test Report Analysis

After running tests, check the JSON report:

```bash
# View latest report
cat qa-test-report-*.json | jq '.[] | select(.status=="FAIL")'

# Count failures
cat qa-test-report-*.json | jq '[.[] | select(.status=="FAIL")] | length'
```

## Performance Monitoring

Track test performance over time:

```bash
# Compare reports
diff <(jq -r '.[] | "\(.name): \(.status)"' report1.json) \
     <(jq -r '.[] | "\(.name): \(.status)"' report2.json)
```

## Automated Alerts

Set up alerts for critical failures:

```bash
# Alert if critical tests fail
if grep -q '"status":"FAIL"' qa-test-report-*.json; then
  echo "⚠️  QA Tests Failed - Check report immediately"
  # Send Slack/email notification
fi
```
