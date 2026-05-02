# GigitekAI Mobile Device Test Checklist

**Last Updated:** May 2, 2026  
**Purpose:** Verify all mobile UI elements, CTAs, and navigation work correctly across devices

---

## Pre-Test Setup

- [ ] Clear browser cache and cookies
- [ ] Test on at least 2 different mobile devices (iOS + Android recommended)
- [ ] Test on both portrait and landscape orientations
- [ ] Open DevTools Network tab to monitor for 4xx/5xx errors
- [ ] Open DevTools Console to check for JavaScript errors

---

## Logo & Navigation

- [ ] Logo displays at correct size (h-14 on mobile, h-20 on desktop)
- [ ] Logo is clickable and navigates to home page (`/`)
- [ ] Hamburger menu icon appears on mobile (hidden on desktop)
- [ ] Hamburger menu opens/closes smoothly
- [ ] Escape key closes the hamburger menu
- [ ] Menu overlay doesn't block content when open

---

## Mobile Navigation Menu Items

Verify all items appear in the hamburger menu and are tappable:

- [ ] Home (with cyan highlight)
- [ ] Services (with all 6 sub-items visible)
  - [ ] Cloud Infrastructure
  - [ ] AI & Machine Learning
  - [ ] Managed IT Services
  - [ ] Cybersecurity
  - [ ] Data Analytics
  - [ ] IT Strategy
- [ ] Helpdesk Pricing
- [ ] ROI Calculator
- [ ] Industries
- [ ] About Us
- [ ] Insights (Blog)
- [ ] ⚡ AI Briefing (cyan highlight)
- [ ] 🤖 Watch AI Work Live (cyan bold highlight)
- [ ] Book a Consultation (with calendar icon)
- [ ] Support (with green pulse dot)
- [ ] Theme Toggle (Light/Dark mode button)
- [ ] Get In Touch (cyan button at bottom)

---

## Sticky Mobile CTA Bar (Bottom)

- [ ] Bar appears on all pages except `/ai-demo`, `/admin/*`, `/helpdesk/*`
- [ ] Bar is fixed to bottom of viewport (doesn't scroll away)
- [ ] Bot icon displays with green pulsing status dot
- [ ] Copy reads: "See AI Agents in Action" / "Live demo — no sign-up required"
- [ ] "Watch AI Work Live" button is cyan and clickable
- [ ] Button navigates to `/ai-demo` page
- [ ] X dismiss button works and hides bar for the session
- [ ] Bar doesn't overlap other UI elements (footer, forms, etc.)
- [ ] Safe area inset respected on notched devices (iPhone X+)

---

## Analytics Tracking

**Note:** Requires Google Analytics (GA ID: G-00F4D2QCEX) to be enabled

Verify events fire when clicking "Watch AI Work Live" from each location:

- [ ] **Utility Bar** (desktop top bar): `event_label: 'utility_bar'`
- [ ] **Desktop Nav**: `event_label: 'desktop_nav'`
- [ ] **Mobile Nav** (hamburger menu): `event_label: 'mobile_nav'`
- [ ] **Mobile Sticky CTA**: `event_label: 'mobile_sticky_cta'`

**How to verify:**
1. Open DevTools → Network tab
2. Filter for requests to `google-analytics.com` or `googletagmanager.com`
3. Click each "Watch AI Work Live" button
4. Verify POST request contains `watch_ai_demo_click` event with correct `event_label`

---

## Responsive Breakpoints

Test at these viewport widths:

| Device | Width | Expected Behavior |
|--------|-------|-------------------|
| iPhone SE | 375px | Single column, sticky CTA bar visible |
| iPhone 12 | 390px | Single column, sticky CTA bar visible |
| iPhone 14 Pro Max | 430px | Single column, sticky CTA bar visible |
| iPad Mini | 768px | Tablet layout, sticky CTA bar visible |
| iPad Pro | 1024px | Desktop layout begins, sticky CTA bar hidden (lg:hidden) |
| Desktop | 1280px+ | Full desktop nav, sticky CTA bar hidden |

---

## Performance Checks

- [ ] Page loads in under 5 seconds on 4G network
- [ ] No layout shifts when sticky CTA bar appears
- [ ] Hamburger menu opens within 300ms
- [ ] Navigation links navigate within 500ms
- [ ] No console errors or warnings
- [ ] No network 4xx/5xx errors

---

## Accessibility Checks

- [ ] Hamburger menu is keyboard accessible (Tab + Enter)
- [ ] Escape key closes menu
- [ ] Focus ring visible on all interactive elements
- [ ] Text has sufficient contrast against background
- [ ] Buttons have minimum 44x44px touch target
- [ ] Form inputs are properly labeled

---

## Cross-Browser Testing

- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Firefox (Android)
- [ ] Samsung Internet (Android)

---

## Known Issues / Notes

(Add any issues found during testing)

---

## Sign-Off

- **Tester Name:** _______________
- **Date:** _______________
- **Result:** ☐ PASS  ☐ FAIL
- **Notes:** _______________________________________________
