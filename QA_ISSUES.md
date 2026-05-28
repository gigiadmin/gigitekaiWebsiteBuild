# QA Issues Tracker

## Active Issues

### Critical Issues (Blocking Production)

- [ ] **Admin Login OAuth Error** - Production only
  - URL: https://gigitekai.com/admin/login
  - Issue: JSON parsing error when clicking "Sign in with Microsoft"
  - Root Cause: OAuth callback returning HTML instead of JSON
  - Status: INVESTIGATING
  - Priority: CRITICAL

- [ ] **Customer Invite Form Validation Error**
  - URL: https://gigitekai.com/admin/invites
  - Issue: Invalid email format validation error
  - Root Cause: Missing Zod import in customer-invites.ts
  - Status: FIXED (pending test)
  - Priority: CRITICAL

### High Priority Issues

- [ ] **Support Landing Modal Routing**
  - URL: https://gigitekai.com/support
  - Issue: Create Ticket card was navigating to /kb instead of opening modal
  - Root Cause: Routing interference with card click handlers
  - Status: FIXED
  - Priority: HIGH

- [ ] **Privacy Policy 404**
  - URL: https://gigitekai.com/privacy
  - Issue: Route only defined as /privacy-policy
  - Root Cause: Missing route alias
  - Status: FIXED
  - Priority: HIGH

### Medium Priority Issues

- [ ] **Phone Number Standardization**
  - Issue: Multiple phone numbers across codebase (609-676-4483 vs 727-382-6909)
  - Root Cause: Inconsistent updates during development
  - Status: FIXED
  - Priority: MEDIUM

- [ ] **Duplicate Ticket Creation**
  - Issue: Race condition in email poller creating duplicate tickets
  - Root Cause: Dedup check before database insert
  - Status: FIXED (UNIQUE constraint added)
  - Priority: MEDIUM

## Resolved Issues

### Fixed in Current Session

- [x] **Support Landing Modal Fix** - Converted cards to button elements
- [x] **Email Parameter Pre-fill** - TicketLookup now reads URL params
- [x] **Phone Number Standardization** - All numbers updated to 727-382-6909
- [x] **Duplicate Ticket Bug** - UNIQUE constraint on messageId
- [x] **Privacy Route Missing** - Added /privacy alias
- [x] **Customer Invite Import Error** - Added Zod import

## Testing Checklist

### Before Each Deployment

- [ ] Run automated QA test suite
- [ ] Test all contact forms
- [ ] Test all navigation links
- [ ] Test admin portal login
- [ ] Test ticket creation flow
- [ ] Test email notifications
- [ ] Test mobile responsiveness

### Weekly Spot Checks

- [ ] Homepage loads correctly
- [ ] Contact form works
- [ ] Support portal works
- [ ] Admin login works
- [ ] Knowledge base search works

### Monthly Comprehensive Audit

- [ ] All forms tested
- [ ] All links tested
- [ ] All pages load
- [ ] All CTAs functional
- [ ] Mobile responsiveness verified
- [ ] Email notifications working
- [ ] Admin functions working

## Known Limitations

- Admin login uses Azure MSAL (separate from Manus OAuth)
- Some forms create draft tickets pending approval
- Email notifications depend on SendGrid configuration
- Admin portal restricted to harry@gigitekai.com

## Testing Environment

- **Dev Server:** https://3000-iuxswlxzqqg5x1p0cf63y-d0589f2f.us2.manus.computer
- **Production:** https://gigitekai.com
- **Test User Email:** test@example.com
- **Admin User:** harry@gigitekai.com

## Next Steps

1. Fix admin login OAuth error on production
2. Test all forms after fixes
3. Run full automated test suite
4. Document any new issues found
5. Create deployment checklist
