# GigitekAI QA Testing Framework

## Overview
This document provides a repeatable, systematic process for testing all forms, links, and functionality on the GigitekAI website to ensure production quality.

## Testing Categories

### 1. Form Testing Checklist

#### Contact Forms
- [ ] **Homepage Hero CTA** (`/` - "Start Your Transformation" button)
  - Expected: Opens contact form or navigates to contact page
  - Fields: Name, Email, Phone, Company, Message
  - Validation: Email format, required fields
  - Submission: Should create ticket + send confirmation email

- [ ] **Free Audit Form** (`/free-audit`)
  - Expected: Collects audit request details
  - Fields: Company name, industry, employee count, current tools, email, phone
  - Validation: All required fields, email format
  - Submission: Creates audit ticket, sends confirmation

- [ ] **Pricing Page CTAs** (`/pricing`)
  - Expected: "Get Started" buttons on each tier
  - Action: Should open contact form or navigate to consultation page
  - Validation: Form appears and is functional

- [ ] **Helpdesk Pricing** (`/helpdesk-pricing`)
  - Expected: "Contact Sales" buttons
  - Action: Opens contact modal or form
  - Validation: Form submits and creates ticket

- [ ] **Support Portal** (`/support`)
  - Expected: "Create Ticket" and "Look Up Ticket" options
  - Validation: Email form works, navigates to lookup page with email param

- [ ] **Admin Portal - Invite Customer** (`/admin/invites`)
  - Expected: Modal form with Email, Name, Company fields
  - Validation: Email validation, required fields
  - Submission: Sends invite email, creates customer account

- [ ] **Contact Page** (`/contact`)
  - Expected: Full contact form
  - Fields: Name, Email, Phone, Company, Subject, Message
  - Validation: Email format, required fields
  - Submission: Creates ticket, sends confirmation

#### Newsletter/Email Forms
- [ ] **Footer Newsletter Signup** (all pages)
  - Expected: Email input field
  - Validation: Email format required
  - Submission: Adds to mailing list

### 2. Link Testing Checklist

#### Navigation Links
- [ ] **Main Navigation Menu**
  - Services dropdown: AI, Security, Strategy, Data, Managed
  - Industries dropdown: Healthcare, Financial, Manufacturing, Retail, Government, Education
  - About Us, Free Audit, Helpdesk Pricing, Insights, KB, Support

- [ ] **Footer Links**
  - All service links
  - All industry links
  - Legal: Privacy Policy, Terms of Service
  - Social media: LinkedIn, Twitter, Facebook, YouTube
  - Contact: Phone, Email

- [ ] **Internal Page Links**
  - Blog posts linking to related articles
  - Case studies linking to relevant services
  - Insights linking to blog

#### External Links
- [ ] **Social Media Links**
  - LinkedIn profile
  - Twitter/X profile
  - Facebook page
  - YouTube channel

- [ ] **Third-party Integrations**
  - Partner links
  - Vendor links
  - Resource links

### 3. Button/CTA Testing

- [ ] **Primary CTAs** (Cyan/Electric Blue buttons)
  - "Start Your Transformation"
  - "Book a Free Demo"
  - "Get Started"
  - "Send Invitation"
  - "Continue"

- [ ] **Secondary CTAs** (Outline buttons)
  - "View Our Solutions"
  - "Learn More"
  - "Explore"

- [ ] **Navigation Buttons**
  - "Back to Home"
  - "Back to GigitekAI.com"
  - Breadcrumb navigation

### 4. Page-Specific Testing

#### Marketing Pages
- [ ] Homepage (`/`)
  - Hero section loads
  - All CTAs functional
  - Navigation works
  - Footer displays correctly

- [ ] Services Pages (`/services/*`)
  - Service detail pages load
  - Related services links work
  - CTAs functional

- [ ] Industries Pages (`/industries/*`)
  - Industry detail pages load
  - Compliance info displays
  - CTAs functional

- [ ] Blog/Insights (`/blog`, `/insights`)
  - Articles load
  - Search/filter works
  - Related articles link

#### Admin Portal
- [ ] Login Page (`/admin/login`)
  - Microsoft OAuth button works
  - Error messages display correctly
  - Redirect after login works

- [ ] Dashboard (`/admin`)
  - Loads with proper authentication
  - All widgets display
  - Navigation sidebar works

- [ ] Ticket Management (`/admin/tickets`)
  - List loads
  - Filters work
  - Ticket detail opens
  - Assignment works
  - Status updates work

- [ ] Customer Management (`/admin/invites`)
  - Invite form works
  - Email validation works
  - Invites send
  - List displays

#### Support Portal
- [ ] Support Landing (`/support`)
  - Create Ticket modal opens
  - Email form validation works
  - Navigation to lookup works

- [ ] Ticket Lookup (`/support/lookup`)
  - Email parameter pre-fills
  - Search works
  - Ticket details display

- [ ] Knowledge Base (`/kb`)
  - Articles load
  - Search works
  - Filter works
  - Article links work

## Testing Process

### Step 1: Automated Link Audit
```bash
# Run link checker (requires installation)
npm run test:links
# or
pnpm test:links
```

### Step 2: Form Validation Testing
1. Open each form
2. Test with invalid data:
   - Empty required fields
   - Invalid email format
   - Invalid phone format
   - XSS attempts
3. Test with valid data
4. Verify submission success
5. Check for confirmation email

### Step 3: Navigation Testing
1. Click each navigation link
2. Verify correct page loads
3. Check for 404 errors
4. Verify breadcrumbs work

### Step 4: Admin Portal Testing
1. Login with valid credentials
2. Test each admin function
3. Verify permissions work
4. Test form submissions
5. Check email notifications

### Step 5: Mobile Responsiveness
1. Test on mobile viewport (375px)
2. Test on tablet viewport (768px)
3. Test on desktop viewport (1920px)
4. Verify forms work on all sizes
5. Check navigation menu on mobile

## Bug Report Template

When you find an issue, document it:

```
**Title:** [Brief description]
**URL:** [Page URL]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]
**Actual Result:** [What actually happens]
**Screenshots:** [If applicable]
**Severity:** [Critical/High/Medium/Low]
```

## Automated Testing Script

See `QA_TEST_SCRIPT.ts` for automated form and link testing.

## Testing Schedule

- **Before each deployment:** Run full test suite
- **Weekly:** Spot check critical forms
- **Monthly:** Full comprehensive audit
- **On bug report:** Immediate reproduction and fix

## Known Issues Tracker

See `QA_ISSUES.md` for ongoing issues and their status.

## Continuous Improvement

1. Document new forms/links as they're added
2. Update test cases based on user feedback
3. Add new test cases for reported bugs
4. Review and update this framework monthly
