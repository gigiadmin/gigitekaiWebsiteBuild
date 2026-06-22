# GigitekAI Website Rebuild — Comprehensive Handoff Prompt

**From:** Harry (CEO & Founder)  
**To:** [Agent Name]  
**Date:** June 21, 2026  
**Objective:** Rebuild gigitekai.com with improved branding, design, and professional polish while maintaining all current functionality and databases

---

## Executive Summary

You're taking over the rebuild of **gigitekai.com**, an **AI-first Managed Services Provider (MSP)** website. The current site is fully functional but needs a visual refresh and professional polish. You'll work in **phases**, maintaining all existing databases, backend logic, and infrastructure while improving design, branding, and user experience.

**Key Constraint:** Use the existing tech stack, databases, and infrastructure. We'll evaluate hosting/platform changes later.

---

## Current Business Context

### About GigitekAI
- **What We Do:** AI-first managed IT and compliance solutions for regulated-sector SMBs (healthcare, legal, construction, financial services)
- **Target Market:** Tampa Bay area, expanding nationally
- **Headquarters:** Tampa Bay, Florida
- **Clients:** 50+ regulated-sector SMBs across North America and Canada
- **Key Differentiator:** AI agents that replace manual workflows, security-first/Zero Trust architecture, deep compliance expertise

### Core Services (4 Tiers)
1. **Essential Security** ($99/user/month) — 24/7 monitoring, backups, basic compliance
2. **Professional Compliance** ($149/user/month) — HIPAA/legal/CMMC/SOC 2 compliance management
3. **Elite + Governed AI** ($199/user/month) — Copilot + AI governance + automation
4. **Enterprise Custom** (custom quote) — Full-stack infrastructure + dedicated team

### Key USPs
- Security-first / Zero Trust architecture
- AI agents as full-time employees (deploy in ~3.4 seconds)
- Deep regulated industry expertise (HIPAA, legal, CMMC, SOC 2)
- Proven ROI: 40% cost reduction, 280+ hours freed monthly, 99.9% uptime SLA

---

## Current Site Architecture

### Tech Stack
- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Database:** MySQL (Drizzle ORM)
- **Hosting:** Manus (autoscale serverless)
- **Domains:** gigitekai.com, gginfo.net, ggai.llc
- **CDN:** Cloudflare
- **Email:** SendGrid
- **Video/Media:** Hosted on Manus storage

### Current Design System
- **Colors:** Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
- **Typography:** Space Grotesk (display) + DM Sans (body)
- **Aesthetic:** Cyberpunk Minimalism meets Enterprise Precision
- **Vibe:** Tech-forward, secure, professional

### Current Pages & Sections
1. **Home** (hero + lazy-loaded sections)
   - Hero Section
   - Services Section (4 tiers)
   - Why Choose Us
   - Benefits Section
   - Stats Section
   - Who We Serve
   - Industries Section
   - Agentic Orchestration Section
   - ROI Promotion Section
   - Lead Magnets
   - Free Audit CTA
   - Industry Benchmarks Widget
   - Newsletter Signup
   - Insights Section
   - Project Untouchable
   - FAQ Section
   - CTA Section
   - Footer

2. **Pricing Page** — Service tier details, comparison, CTAs

3. **Contact Page** — Form, contact info, support channels

4. **Admin Portal** — Helpdesk, ticketing, compliance dashboards

5. **Blog/Insights** — Thought leadership, industry insights

---

## Current Database Schema (Key Tables)

### Core Tables
- **users** — User accounts, roles, auth
- **adminCredentials** — Admin/agent login credentials
- **tickets** — Helpdesk tickets (title, priority, status, SLA tracking)
- **ticketReplies** — Ticket conversation history
- **chatSessions** — Live chat/AI chat sessions
- **agentAssignments** — Ticket/chat assignments to agents
- **agentMetrics** — Agent performance tracking
- **agentSchedules** — Agent availability schedules
- **agentWorkload** — Daily workload tracking
- **agentTakeoverRequests** — Escalation requests
- **adminNotifications** — Admin alerts and notifications
- **newsletterCampaigns** — Email campaigns
- **voicemailMessages** — Voicemail recordings/transcriptions
- **callRecordings** — Call recordings and metadata
- **contactFormSubmissions** — Website contact form submissions
- **adminMenuCustomization** — User-specific admin UI preferences

### Key Relationships
- Users → Tickets (1:many)
- Agents → Assignments (1:many)
- Tickets → Replies (1:many)
- Chat Sessions → Agents (many:1)

**Important:** Do NOT modify the database schema without explicit approval. The rebuild focuses on UI/UX, not data structure.

---

## Current Features (Maintain These)

### Public Site Features
- ✅ Responsive design (mobile-first)
- ✅ SEO optimization (meta tags, structured data)
- ✅ Lead capture (contact form, email signup)
- ✅ Service tier comparison
- ✅ Pricing transparency
- ✅ Blog/insights section
- ✅ Free audit CTA
- ✅ Newsletter signup
- ✅ FAQ section
- ✅ Performance optimized (lazy-loaded sections, image optimization)

### Admin Portal Features
- ✅ Helpdesk ticketing system
- ✅ Real-time SLA tracking
- ✅ Agent assignment & workload balancing
- ✅ Chat/voicemail integration
- ✅ Compliance dashboards
- ✅ Admin notifications
- ✅ Call recording management
- ✅ Newsletter campaign management
- ✅ Contact form submissions tracking
- ✅ Agent performance metrics

### Integrations
- ✅ Microsoft Teams (notifications, bot)
- ✅ SendGrid (email)
- ✅ Stripe (payments)
- ✅ Cloudflare (DNS, CDN)
- ✅ Manus Auth (OAuth)
- ✅ Manus LLM (Claude integration)
- ✅ Manus Storage (S3 for media)

---

## Rebuild Phases (Phased Approach)

### Phase 1: Discovery & Design (Week 1)
**Goal:** Establish new design direction and component library

**Tasks:**
1. Review current site design and branding
2. Define new visual direction (more professional, cleaner, modern)
3. Create updated color palette (keep cyan accent, refine navy/dark tones)
4. Design typography hierarchy (maintain Space Grotesk + DM Sans or propose alternatives)
5. Create component library (buttons, cards, forms, navigation)
6. Design new hero section
7. Create design system documentation
8. Get Harry's approval on design direction

**Deliverables:**
- Design system (colors, typography, spacing, shadows)
- Component library (Figma or similar)
- Hero section mockup
- Navigation design
- Approval from Harry

---

### Phase 2: Frontend Refactor — Public Site (Week 2-3)
**Goal:** Rebuild public-facing pages with new design while maintaining functionality

**Tasks:**
1. Update global styles (index.css) with new design tokens
2. Refactor Navigation component (SiteNavBar2024)
3. Rebuild Hero Section with new design
4. Rebuild Services Section (4 tiers) with new layout
5. Rebuild Why Choose Us section
6. Rebuild Benefits section
7. Rebuild Stats section
8. Rebuild Industries section
9. Rebuild FAQ section
10. Rebuild CTA sections
11. Update Footer
12. Test responsive design (mobile, tablet, desktop)
13. Optimize performance (Core Web Vitals)

**Deliverables:**
- Updated public pages
- Mobile-responsive design
- Performance metrics (LCP, FID, CLS)
- Browser testing results

---

### Phase 3: Admin Portal Polish (Week 4)
**Goal:** Improve admin UI consistency and usability

**Tasks:**
1. Update admin dashboard styling (new design system)
2. Refactor admin sidebar navigation
3. Update ticket management UI
4. Update agent assignment UI
5. Improve admin notifications display
6. Update compliance dashboards
7. Refactor forms (contact, ticket creation, etc.)
8. Test admin workflows (ticket creation, assignment, resolution)

**Deliverables:**
- Updated admin UI
- Improved navigation
- Consistent styling across admin pages
- Workflow testing results

---

### Phase 4: SEO & Performance Optimization (Week 5)
**Goal:** Ensure site is fully optimized for search and performance

**Tasks:**
1. Audit current SEO (meta tags, structured data, keywords)
2. Update meta tags for all pages
3. Implement structured data (Schema.org)
4. Optimize images (WebP, responsive sizes)
5. Minimize CSS/JS bundles
6. Implement lazy loading for below-fold sections
7. Test Core Web Vitals
8. Set up monitoring (Google Analytics, Lighthouse)
9. Submit sitemap to Google Search Console

**Deliverables:**
- SEO audit report
- Updated meta tags
- Performance report
- Monitoring setup

---

### Phase 5: Content & Copy Refinement (Week 6)
**Goal:** Ensure all copy is polished, compelling, and on-brand

**Tasks:**
1. Review all page copy (hero, services, benefits, etc.)
2. Refine messaging (clarity, benefit-focused, compliance-first)
3. Update service tier descriptions
4. Update FAQ answers
5. Refine CTA copy (buttons, forms)
6. Update footer copy
7. Proofread all content
8. A/B test key CTAs (if applicable)

**Deliverables:**
- Refined copy on all pages
- Messaging guidelines
- CTA performance metrics

---

### Phase 6: Testing & QA (Week 7)
**Goal:** Ensure site is production-ready

**Tasks:**
1. Cross-browser testing (Chrome, Firefox, Safari, Edge)
2. Mobile device testing (iPhone, Android)
3. Accessibility testing (WCAG 2.1 AA compliance)
4. Form testing (contact form, email signup, etc.)
5. Link testing (all internal/external links)
6. Email testing (newsletter, notifications)
7. Admin portal testing (all workflows)
8. Performance testing (load times, optimization)
9. Security testing (SSL, CORS, auth)
10. Create QA checklist and sign-off

**Deliverables:**
- QA report
- Bug fixes
- Testing checklist (signed off)

---

### Phase 7: Deployment & Launch (Week 8)
**Goal:** Deploy new site to production

**Tasks:**
1. Create backup of current site
2. Deploy to staging environment
3. Final review with Harry
4. Deploy to production
5. Monitor for errors (first 24 hours)
6. Update DNS/domains if needed
7. Announce redesign (email, social, etc.)
8. Collect feedback from users

**Deliverables:**
- Deployed site
- Deployment notes
- Monitoring setup
- Feedback collection plan

---

## Design Direction (Current Guidance)

### Visual Refresh Goals
- **More Professional:** Clean, modern, enterprise-grade
- **Better Hierarchy:** Clear visual distinction between sections
- **Improved Readability:** Better contrast, larger fonts where needed
- **Modern Aesthetics:** Current design is good, but can be more polished
- **Maintained Brand:** Keep cyan accent (#00D4FF), refine navy/dark tones

### Color Palette (Current)
- **Primary Dark:** #0A0E1A (deep navy-black)
- **Accent:** #00D4FF (electric cyan)
- **Secondary:** #1A1A1A, #2A2A2A, #3A3A3A (grays)
- **Text:** #FFFFFF (white), #E0E0E0 (light gray)

**Potential Refinements:**
- Consider adding a secondary accent (e.g., teal, purple)
- Refine gray palette for better contrast
- Consider a lighter background option for certain sections

### Typography (Current)
- **Display:** Space Grotesk (bold, modern)
- **Body:** DM Sans (clean, readable)

**Potential Refinements:**
- Consider font sizes (may need to increase for better readability)
- Consider font weights (bold, semi-bold, regular)
- Consider line-height (1.5-1.8 for body text)

---

## Key Metrics to Track

### Performance Metrics
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Page Load Time: < 3s

### SEO Metrics
- Keyword rankings (target keywords: "managed IT Tampa Bay", "HIPAA compliance MSP", etc.)
- Organic traffic
- Click-through rate (CTR)
- Bounce rate

### Engagement Metrics
- Contact form submissions
- Email signups
- CTA click-through rate
- Time on page

### Conversion Metrics
- Free audit requests
- Pricing page views
- Contact form completions
- Demo requests

---

## Important Constraints & Guidelines

### Do's
✅ Use existing database schema (no modifications without approval)  
✅ Maintain all current functionality  
✅ Keep existing integrations (Teams, SendGrid, Stripe, etc.)  
✅ Use React 19 + Tailwind CSS 4 + TypeScript  
✅ Optimize for performance (Core Web Vitals)  
✅ Test thoroughly before deployment  
✅ Document all changes  
✅ Get Harry's approval at each phase  

### Don'ts
❌ Don't modify database schema  
❌ Don't remove existing features  
❌ Don't change hosting/infrastructure (yet)  
❌ Don't break existing integrations  
❌ Don't deploy without testing  
❌ Don't make major changes without approval  

---

## File Structure (Current)

```
gigitekai/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── AdminCallReviewPage.tsx
│   │   │   └── ... (other pages)
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── SiteNavBar2024.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ... (other components)
│   │   ├── lib/
│   │   │   ├── trpc.ts
│   │   │   ├── seoConfig.ts
│   │   │   └── ... (utilities)
│   │   ├── index.css (global styles)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── robots.txt
│   │   └── ... (config files only)
│   └── ... (Vite config, package.json, etc.)
├── server/
│   ├── routers.ts (tRPC procedures)
│   ├── db.ts (database helpers)
│   ├── storage.ts (S3 helpers)
│   └── ... (other server files)
├── drizzle/
│   ├── schema.ts (database schema)
│   ├── migrations/ (database migrations)
│   └── ... (Drizzle config)
├── shared/
│   ├── types.ts (shared types)
│   └── ... (shared utilities)
└── ... (root config files)
```

**Important:** Do NOT modify files in `server/_core/`, `drizzle/migrations/`, or `shared/_core/` unless absolutely necessary. These are framework-level files.

---

## Communication & Approval Process

### Weekly Check-ins
- **Monday:** Phase kickoff + approval of design/approach
- **Wednesday:** Mid-week progress update
- **Friday:** Weekly deliverables review + next week planning

### Approval Gates
- **Phase 1:** Design system + component library approval
- **Phase 2:** Public site redesign approval (desktop + mobile)
- **Phase 3:** Admin portal polish approval
- **Phase 4:** SEO/performance audit approval
- **Phase 5:** Copy refinement approval
- **Phase 6:** QA sign-off
- **Phase 7:** Final launch approval

### Communication Channels
- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Slack/Teams:** [To be determined]

---

## Success Criteria

### Phase 1 (Design)
- ✅ Design system documented
- ✅ Component library created
- ✅ Hero section mockup approved
- ✅ Harry gives thumbs-up on direction

### Phase 2 (Public Site)
- ✅ All pages redesigned with new design system
- ✅ Mobile-responsive on all devices
- ✅ Core Web Vitals: LCP < 2.5s, CLS < 0.1
- ✅ All links working
- ✅ Forms functional

### Phase 3 (Admin Portal)
- ✅ Admin UI consistent with public site
- ✅ All admin workflows tested
- ✅ Navigation improved
- ✅ No broken features

### Phase 4 (SEO/Performance)
- ✅ SEO audit completed
- ✅ Meta tags updated
- ✅ Structured data implemented
- ✅ Core Web Vitals optimized
- ✅ Google Search Console set up

### Phase 5 (Copy)
- ✅ All copy refined and proofread
- ✅ Messaging consistent across site
- ✅ CTAs compelling and clear
- ✅ Harry approves all copy

### Phase 6 (QA)
- ✅ Cross-browser testing complete
- ✅ Mobile testing complete
- ✅ Accessibility testing complete (WCAG 2.1 AA)
- ✅ All bugs fixed
- ✅ QA checklist signed off

### Phase 7 (Launch)
- ✅ Site deployed to production
- ✅ No errors in first 24 hours
- ✅ Monitoring set up
- ✅ Feedback collection plan active

---

## Resources & References

### Current Site
- **Live:** https://gigitekai.com
- **Admin Portal:** https://gigitekai.com/admin
- **GitHub:** [To be provided]

### Documentation
- **Brand Guidelines:** See AI_AGENT_SYSTEM_PROMPT.md
- **Tech Stack:** React 19, Tailwind CSS 4, Express 4, tRPC 11, MySQL
- **Design System:** Current colors (#0A0E1A, #00D4FF), fonts (Space Grotesk, DM Sans)

### Key Contacts
- **Harry (CEO):** support@gigitekai.com, (609) 676-4483
- **Support Team:** support@gigitekai.com

---

## Questions Before Starting?

Before you begin Phase 1, clarify:

1. **Design Direction:** Do you want to keep the current color palette (#0A0E1A + #00D4FF), or explore alternatives?
2. **Typography:** Keep Space Grotesk + DM Sans, or consider other fonts?
3. **Layout:** Any specific layout changes (hero section, service cards, footer)?
4. **Messaging:** Should we refine copy to be more compliance-focused, or keep current tone?
5. **Timeline:** Is 8 weeks realistic, or do you need faster/slower pace?
6. **Hosting:** Any plans to change hosting/infrastructure after redesign?

---

## Final Notes

This is a **rebuild with continuity**—you're not starting from scratch. The current site works well; you're making it look and feel more professional while maintaining all functionality and databases.

**Your role:** Be the design and UX expert. Make recommendations, iterate with Harry, and deliver a site that represents GigitekAI's positioning as a security-first, AI-first MSP for regulated industries.

**Success = Professional, polished, performant, and conversion-focused.**

Good luck! 🚀

---

**Questions?** Reach out to Harry at support@gigitekai.com or (609) 676-4483.
