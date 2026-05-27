# GigitekAI Website - Comprehensive Test Plan

**Last Updated:** May 27, 2026  
**Test Environment:** Production (gigitekai.com)  
**Tester:** Harry  
**Status:** Ready for Testing

---

## PART 1: MAIN WEBSITE TESTING (Public Pages - No Login Required)

### 1.1 Homepage (/)
**URL:** https://gigitekai.com

**Navigation & Layout:**
- [ ] Page loads without errors
- [ ] All navbar links are clickable and functional
- [ ] Logo redirects to homepage
- [ ] Mobile menu opens/closes correctly
- [ ] Theme toggle (dark/light) works
- [ ] All fonts and colors match brand guidelines

**Hero Section:**
- [ ] Hero headline displays correctly
- [ ] Hero CTA button ("Start Your Transformation") is clickable
- [ ] Hero CTA button opens contact form or redirects correctly
- [ ] Hero background image loads
- [ ] Responsive layout on mobile/tablet/desktop

**Stats Section:**
- [ ] All stats display (50+ Clients, 99.9% Uptime, 24/7 AI Support)
- [ ] Numbers are readable and properly formatted
- [ ] Icons display correctly

**Services Section:**
- [ ] All service cards display (Cloud, AI, Helpdesk, Security, etc.)
- [ ] Service descriptions are clear and readable
- [ ] Service cards are clickable (if applicable)
- [ ] Responsive grid layout on all screen sizes

**Industries Section:**
- [ ] All industry cards display
- [ ] Industry icons load correctly
- [ ] Cards are properly aligned

**FAQ Section:**
- [ ] All FAQ items expand/collapse correctly
- [ ] FAQ text is readable
- [ ] No layout shifts when expanding/collapsing

**Footer:**
- [ ] All footer links are functional
- [ ] Contact info displays (phone, email)
- [ ] Social media links present (if applicable)
- [ ] Copyright notice displays
- [ ] Privacy Policy link works
- [ ] Terms of Service link works

---

### 1.2 Services Page (/services)
**URL:** https://gigitekai.com/services

**Page Load:**
- [ ] Page loads without errors
- [ ] All service details display
- [ ] Images/icons load correctly

**Service Cards:**
- [ ] Each service card displays title, description, features
- [ ] CTA buttons are clickable
- [ ] Responsive layout on mobile

**Navigation:**
- [ ] Back to home link works
- [ ] Breadcrumb navigation (if present) works

---

### 1.3 Industries Page (/industries)
**URL:** https://gigitekai.com/industries

**Page Load:**
- [ ] Page loads without errors
- [ ] All industry cards display

**Industry Details:**
- [ ] Each industry shows relevant use cases
- [ ] Industry-specific solutions are clear
- [ ] CTA buttons functional

---

### 1.4 Helpdesk Pricing Page (/helpdesk-pricing)
**URL:** https://gigitekai.com/helpdesk-pricing

**Page Load:**
- [ ] Page loads without errors
- [ ] All three pricing tiers display (Essential, Professional, Elite)

**Pricing Tiers:**
- [ ] Essential tier: $69/user/month displays
- [ ] Professional tier: $119/user/month displays (marked "MOST POPULAR")
- [ ] Elite tier: $189/user/month displays
- [ ] All features list correctly under each tier

**User Count Selector:**
- [ ] User count input accepts values
- [ ] Price updates when user count changes
- [ ] Volume discount applies at 25+ users
- [ ] Annual/Monthly toggle works
- [ ] Annual discount (10%) applies correctly
- [ ] Total price calculation is accurate

**CTA Buttons:**
- [ ] "Get Started" buttons are visible
- [ ] Clicking "Get Started" opens contact form modal (NOT Stripe checkout)
- [ ] Contact form pre-fills with plan name and user count
- [ ] Form can be submitted successfully
- [ ] Confirmation message displays after submission

**Bottom CTA:**
- [ ] "Schedule a Discovery Call" button is clickable
- [ ] Button opens contact form or redirects correctly

---

### 1.5 Knowledge Base Page (/kb)
**URL:** https://gigitekai.com/kb

**Page Load:**
- [ ] Page loads without errors
- [ ] KB articles display in list/grid format

**Search Functionality:**
- [ ] Search box is visible and functional
- [ ] Typing in search filters articles
- [ ] Search results display correctly
- [ ] Clear search button works

**Filtering:**
- [ ] Category filter dropdown works
- [ ] Filtering by category updates article list
- [ ] Multiple filters can be applied

**Sorting:**
- [ ] Sort by "Newest" works
- [ ] Sort by "Most Viewed" works
- [ ] Sort by "Rating" works
- [ ] Articles reorder correctly

**Article Viewing:**
- [ ] Clicking article opens full view
- [ ] Article content displays correctly
- [ ] Back button returns to KB list
- [ ] Article metadata (views, rating, date) displays

---

### 1.6 Insights/Blog Page (/insights or /blog)
**URL:** https://gigitekai.com/insights

**Page Load:**
- [ ] Page loads without errors
- [ ] Blog articles display in list format

**Article List:**
- [ ] Article titles, dates, authors display
- [ ] Article preview text shows
- [ ] Featured images load correctly

**Article Detail:**
- [ ] Clicking article opens full post
- [ ] Article content renders correctly
- [ ] Formatting (headings, paragraphs, lists) displays properly
- [ ] Back button returns to blog list

**Search (if available):**
- [ ] Blog search filters articles
- [ ] Search results are accurate

---

### 1.7 About Page (/about)
**URL:** https://gigitekai.com/about

**Page Load:**
- [ ] Page loads without errors
- [ ] Company info displays

**Content:**
- [ ] Company mission/vision statement displays
- [ ] Team info displays (if present)
- [ ] Company history/background displays
- [ ] Contact info displays

---

### 1.8 Contact Page (/contact)
**URL:** https://gigitekai.com/contact

**Page Load:**
- [ ] Page loads without errors
- [ ] Contact form displays

**Contact Form:**
- [ ] Form fields: Name, Email, Subject, Message all present
- [ ] Form fields accept input
- [ ] Form validation works (required fields)
- [ ] Submit button is clickable
- [ ] Form submission succeeds
- [ ] Success message displays
- [ ] Confirmation email sent to user (check email)
- [ ] Owner notification sent (check admin panel)

---

### 1.9 Helpdesk Dashboard (/helpdesk/dashboard)
**URL:** https://gigitekai.com/helpdesk/dashboard

**Page Load (Requires Login):**
- [ ] Page redirects to login if not authenticated
- [ ] After login, dashboard displays
- [ ] User name displays in header

**Dashboard Stats:**
- [ ] Total tickets count displays
- [ ] Open tickets count displays
- [ ] In Progress tickets count displays
- [ ] Resolved tickets count displays
- [ ] Closed tickets count displays

**Ticket List:**
- [ ] Recent tickets display
- [ ] Ticket ID, title, status, priority display
- [ ] Ticket list is sortable/filterable

**Navigation:**
- [ ] "My Tickets" link works
- [ ] "New Ticket" button works

---

### 1.10 Create Ticket Page (/helpdesk/tickets/new)
**URL:** https://gigitekai.com/helpdesk/tickets/new

**Page Load:**
- [ ] Page loads without errors
- [ ] Ticket form displays

**Ticket Form:**
- [ ] Subject field accepts input (min 5 chars)
- [ ] Description field accepts input (min 10 chars)
- [ ] Category dropdown works (General, Technical, Billing, etc.)
- [ ] Priority dropdown works (Low, Medium, High, Critical)
- [ ] Steps Attempted field accepts input (optional, min 5 chars if filled)
- [ ] Include Chat Transcript toggle works
- [ ] Submit button is clickable

**Form Validation:**
- [ ] Form shows error if Subject < 5 chars
- [ ] Form shows error if Description < 10 chars
- [ ] Form shows error if required fields empty
- [ ] Character count displays for each field
- [ ] Validation messages are clear

**Form Submission:**
- [ ] Form submits successfully with valid data
- [ ] Success message displays
- [ ] Ticket appears in dashboard
- [ ] Confirmation email sent to user
- [ ] Ticket ID is provided

**Duplicate Prevention:**
- [ ] Submitting same ticket twice doesn't create duplicates
- [ ] Idempotency key prevents duplicate submissions

---

### 1.11 AI Chat Widget (Floating on all pages)
**URL:** Visible on all pages

**Widget Appearance:**
- [ ] Chat widget appears in bottom-right corner
- [ ] Widget icon is visible and clickable
- [ ] Widget can be minimized/expanded

**Chat Functionality:**
- [ ] Chat opens when clicking widget
- [ ] User can type messages
- [ ] Messages send successfully
- [ ] Bot responds to messages
- [ ] Chat history displays
- [ ] Typing indicators show

**Chat Features:**
- [ ] Save chat button works (downloads transcript)
- [ ] Clear chat button works (deletes all messages)
- [ ] Minimize button works
- [ ] Close button works

**Ticket Escalation:**
- [ ] Saying "yes to call" or similar triggers specialist form
- [ ] Specialist contact form opens
- [ ] Form can be submitted
- [ ] Ticket is created from escalation
- [ ] No duplicate tickets created on multiple submissions

**KB Integration:**
- [ ] Bot suggests KB articles for relevant questions
- [ ] KB suggestions are accurate and helpful
- [ ] Clicking KB article opens it

**Business Hours:**
- [ ] During business hours: Bot offers to connect with specialist
- [ ] Outside business hours: Bot suggests KB articles and callback
- [ ] Holiday detection works (shows "closed for [Holiday]")

---

### 1.12 Aria Chat Widget (Alternative Chat Interface)
**URL:** Visible on homepage (right side)

**Widget Appearance:**
- [ ] Widget displays on right side of page
- [ ] Widget title: "GigitekAI Assistant"
- [ ] Widget subtitle: "AI-powered support • Always online"

**Chat Functionality:**
- [ ] Chat accepts messages
- [ ] Bot responds
- [ ] Chat history displays
- [ ] Message formatting is clear

**Ticket Creation from Aria:**
- [ ] Ticket form displays in widget
- [ ] Form fields: Subject, Name, Email, Category, Priority, Description
- [ ] Form validation works
- [ ] Form submission creates ticket
- [ ] Ticket appears in admin panel
- [ ] No duplicate tickets on multiple submissions

---

## PART 2: FORM SUBMISSION TESTING

### 2.1 Homepage Contact Form (if present)
**Location:** Homepage footer or CTA section

**Form Fields:**
- [ ] Name field accepts input
- [ ] Email field accepts input
- [ ] Message field accepts input
- [ ] All required fields validated

**Form Submission:**
- [ ] Form submits successfully
- [ ] Success message displays
- [ ] Email confirmation sent to user
- [ ] Owner notification sent

---

### 2.2 Helpdesk Pricing "Get Started" Form
**Location:** /helpdesk-pricing page

**Form Trigger:**
- [ ] Clicking "Get Started" opens contact form
- [ ] Form pre-fills with plan name (Essential/Professional/Elite)
- [ ] Form pre-fills with user count

**Form Submission:**
- [ ] Form submits successfully
- [ ] Ticket created with plan inquiry
- [ ] Confirmation email sent
- [ ] Owner notified

---

### 2.3 Specialist Contact Form (from Chat)
**Location:** Triggered from AI chat widget

**Form Trigger:**
- [ ] Saying "yes to call" or similar opens form
- [ ] Form displays in modal

**Form Fields:**
- [ ] Name field accepts input
- [ ] Company field accepts input
- [ ] Email field accepts input
- [ ] Phone field accepts input
- [ ] Reason dropdown works
- [ ] All fields validated

**Form Submission:**
- [ ] Form submits successfully
- [ ] Lead captured in database
- [ ] Confirmation email sent
- [ ] Owner notified

---

### 2.4 Aria Widget Ticket Form
**Location:** Aria chat widget (right side)

**Form Fields:**
- [ ] Subject field (min 5 chars)
- [ ] Name field
- [ ] Email field
- [ ] Category dropdown
- [ ] Priority dropdown
- [ ] Description field (min 10 chars)
- [ ] Include Chat Transcript toggle

**Form Validation:**
- [ ] Required fields validated
- [ ] Character minimums enforced
- [ ] Error messages display

**Form Submission:**
- [ ] Form submits successfully
- [ ] Ticket created
- [ ] Confirmation displays
- [ ] No duplicate tickets on retry

---

## PART 3: ADMIN PAGE TESTING (/admin)

### 3.1 Admin Login
**URL:** https://gigitekai.com/admin

**Login Flow:**
- [ ] Non-admin users redirected to login
- [ ] Admin users can access /admin
- [ ] Only harry@gigitekai.com allowed (Azure AD)
- [ ] Login redirects to Microsoft 365 sign-in
- [ ] After login, admin dashboard displays

---

### 3.2 Admin Dashboard
**URL:** https://gigitekai.com/admin

**Dashboard Layout:**
- [ ] Sidebar navigation displays
- [ ] All admin menu items visible
- [ ] User profile displays in sidebar
- [ ] Logout button present

**Dashboard Stats:**
- [ ] Total tickets count displays
- [ ] Open tickets count displays
- [ ] In Progress count displays
- [ ] Resolved count displays
- [ ] Closed count displays

---

### 3.3 Tickets Management (/admin/helpdesk)
**URL:** https://gigitekai.com/admin/helpdesk

**Ticket List:**
- [ ] All tickets display
- [ ] Ticket ID, title, status, priority display
- [ ] Ticket list is sortable
- [ ] Ticket list is filterable (by status, priority, category)
- [ ] Search by ticket ID works
- [ ] Search by title works

**Ticket Actions:**
- [ ] Clicking ticket opens detail view
- [ ] Ticket detail shows all info
- [ ] Ticket status can be updated
- [ ] Ticket priority can be updated
- [ ] Ticket can be assigned to agent
- [ ] Ticket can be closed
- [ ] Reply to ticket works
- [ ] Add note to ticket works

**Bulk Actions:**
- [ ] Multiple tickets can be selected
- [ ] "Approve Selected" button works
- [ ] "Reject Selected" button works
- [ ] "Open Tickets" button works
- [ ] Success message displays after bulk action

---

### 3.4 Call Review (/admin/call-review)
**URL:** https://gigitekai.com/admin/call-review

**Call List:**
- [ ] All voicemail/call records display
- [ ] Call ID, caller, duration, date display
- [ ] Call list is filterable

**Call Actions:**
- [ ] Clicking call plays recording (if available)
- [ ] Call transcription displays
- [ ] Call can be converted to ticket
- [ ] Call can be marked as reviewed

---

### 3.5 Knowledge Base Management (/admin/kb)
**URL:** https://gigitekai.com/admin/kb

**KB Article List:**
- [ ] All KB articles display
- [ ] Article title, category, status display
- [ ] Articles are sortable
- [ ] Articles are filterable

**KB Actions:**
- [ ] Clicking article opens editor
- [ ] Article title can be edited
- [ ] Article content can be edited
- [ ] Article category can be changed
- [ ] Article can be published/unpublished
- [ ] Article can be deleted
- [ ] New article can be created
- [ ] Article save succeeds

---

### 3.6 User Management (/admin/users)
**URL:** https://gigitekai.com/admin/users

**User List:**
- [ ] All users display
- [ ] User name, email, role display
- [ ] Users are sortable
- [ ] Users are filterable

**User Actions:**
- [ ] Clicking user opens detail view
- [ ] User role can be changed (admin/user)
- [ ] User can be deactivated
- [ ] User can be deleted

---

### 3.7 Settings (/admin/settings)
**URL:** https://gigitekai.com/admin/settings

**Settings Sections:**
- [ ] General settings display
- [ ] Business hours settings display
- [ ] Holiday settings display
- [ ] Email templates display
- [ ] API keys display (if applicable)

**Settings Actions:**
- [ ] Settings can be edited
- [ ] Changes save successfully
- [ ] Confirmation message displays

---

## PART 4: CROSS-BROWSER & DEVICE TESTING

### 4.1 Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**For each browser, test:**
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] No console errors
- [ ] Responsive layout correct

### 4.2 Mobile Devices
- [ ] iPhone (iOS 16+)
- [ ] Android phone (Android 12+)
- [ ] iPad/Tablet

**For each device, test:**
- [ ] All pages load correctly
- [ ] Mobile menu works
- [ ] Forms are usable on mobile
- [ ] Touch interactions work
- [ ] No layout issues

### 4.3 Responsive Breakpoints
- [ ] Mobile (320px - 480px)
- [ ] Tablet (481px - 768px)
- [ ] Desktop (769px+)

---

## PART 5: PERFORMANCE & SECURITY

### 5.1 Performance
- [ ] Homepage loads in < 3 seconds
- [ ] No broken images
- [ ] No broken links
- [ ] No 404 errors
- [ ] PageSpeed score > 90 (mobile)
- [ ] PageSpeed score > 90 (desktop)

### 5.2 Security
- [ ] HTTPS enabled on all pages
- [ ] No mixed content warnings
- [ ] No security warnings in console
- [ ] Forms use CSRF protection
- [ ] Passwords not logged in console
- [ ] API keys not exposed in frontend code

### 5.3 Accessibility
- [ ] All images have alt text
- [ ] Form labels associated with inputs
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

---

## PART 6: DATA VERIFICATION

### 6.1 Form Submissions
- [ ] Contact form submissions appear in admin panel
- [ ] Ticket submissions appear in admin panel
- [ ] All form data saved correctly
- [ ] Email confirmations sent
- [ ] Owner notifications sent

### 6.2 Database
- [ ] New tickets appear in database
- [ ] New contacts appear in database
- [ ] Ticket counts are accurate
- [ ] No duplicate records

### 6.3 Email
- [ ] User receives confirmation email
- [ ] Owner receives notification email
- [ ] Emails contain correct information
- [ ] Email formatting is correct

---

## TESTING CHECKLIST SUMMARY

**Total Test Cases:** 150+

**Pass Criteria:**
- [ ] All pages load without errors
- [ ] All forms submit successfully
- [ ] All navigation works
- [ ] No duplicate submissions
- [ ] All emails sent correctly
- [ ] Database records created
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] No security issues
- [ ] Performance acceptable

---

## NOTES & OBSERVATIONS

**Date Started:** ___________  
**Date Completed:** ___________  
**Tester:** ___________  

**Issues Found:**
1. 
2. 
3. 

**Observations:**
- 
- 
- 

**Overall Status:** ☐ PASS ☐ FAIL ☐ PASS WITH ISSUES

---

## SIGN-OFF

**Tested By:** ___________  
**Date:** ___________  
**Approved By:** ___________  
**Date:** ___________
