# GigitekAI — Full Stack & Vendor Reference

**Generated:** May 22, 2026  
**Project:** gigitekai (ggai.llc / gigitekai.com)  
**Purpose:** Engineering baseline for scaffolding new client sites

---

## 1. Core Framework Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 19 | UI rendering |
| Routing | Wouter | 3.3 | Client-side routing (lightweight, no React Router) |
| Styling | Tailwind CSS | 4 | Utility-first CSS |
| Build tool | Vite | 7 | Dev server + production bundler |
| Language | TypeScript | 5.9 | End-to-end type safety |
| Backend | Express | 4 | HTTP server |
| API layer | tRPC | 11 | Type-safe RPC (no REST, no Axios) |
| Data fetching | TanStack Query | 5 | Server state management |
| Serialization | Superjson | 1.13 | Date/Map/Set serialization over JSON |
| ORM | Drizzle ORM | 0.44 | Type-safe SQL queries |
| Database | MySQL / TiDB | — | Relational data store |
| DB migrations | Drizzle Kit | 0.31 | Schema push + migrations |
| Runtime | Node.js + tsx | — | Server execution |
| Testing | Vitest | 2 | Unit + integration tests |

---

## 2. UI Component Libraries

| Library | Purpose |
|---------|---------|
| shadcn/ui (via Radix UI) | Full component suite — dialogs, selects, tables, badges, buttons, tabs, tooltips, etc. |
| Radix UI | Headless primitives underlying shadcn (accordion, alert-dialog, avatar, checkbox, dropdown, popover, progress, scroll-area, select, separator, slider, switch, tabs, toggle, tooltip) |
| Lucide React | Icon set (0.453) |
| Recharts | Charts and data visualization |
| Chart.js | Additional charting (used in some admin dashboards) |
| Embla Carousel | Carousel/slider component |
| React Day Picker | Date picker |
| Vaul | Drawer component |
| cmdk | Command palette |
| Input OTP | OTP input field |
| React Resizable Panels | Split-pane layouts |
| Tiptap | Rich text editor (blog/KB article editing) |
| Streamdown | Markdown streaming renderer (AI chat responses) |
| React Markdown + remark-gfm | Static markdown rendering |
| React Hook Form + Zod | Form validation |
| Sonner | Toast notifications |
| next-themes | Dark/light theme provider |
| DOMPurify | XSS sanitization for rendered HTML |

---

## 3. External Vendor APIs & Integrations

### Microsoft / Azure

| Vendor | Env Variable(s) | What it does in the site |
|--------|-----------------|-------------------------|
| Microsoft Graph API | MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, MS_GRAPH_TENANT_ID | M365 health monitoring, Teams presence sync, calendar, email via Exchange |
| Azure Communication Services (ACS) | ACS_CONNECTION_STRING, ACS_RESOURCE_ID | Phone numbers, SMS, voice calls, PSTN integration, call recording |
| Azure Identity / MSAL | AZURE_TENANT_ID, @azure/identity, @azure/msal-browser | Azure AD authentication, token acquisition |
| Azure Speech | AZURE_SPEECH_KEY, AZURE_SPEECH_REGION | Voice transcription / speech-to-text |
| Microsoft Copilot Studio | COPILOT_STUDIO_ENVIRONMENT_ID, COPILOT_KB_QA_AGENT_ID, COPILOT_TICKET_CLASSIFIER_AGENT_ID, COPILOT_VOICE_AGENT_ID | AI agents for KB Q&A, ticket classification, voice handling |
| Microsoft Teams Bot | TEAMS_BOT_APP_ID, TEAMS_BOT_CLIENT_SECRET, TEAMS_BOT_TEAM_ID, TEAMS_BOT_TENANT_ID | Bot Framework SDK — two-way Teams bot |
| Teams Webhooks | TEAMS_WEBHOOK_URL + 8 category-specific webhooks (General, Billing, Email, Hardware, Network, Security, Software, Account Access) | Incoming webhook notifications per helpdesk category |
| Microsoft Bot Builder | botbuilder ^4.23.3 | Teams bot SDK |

### Communication & Messaging

| Vendor | Env Variable(s) | What it does |
|--------|-----------------|-------------|
| Twilio | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER | SMS campaigns, alerts, call routing |
| SendGrid | SENDGRID_API_KEY | Transactional email, helpdesk notifications, drip campaigns |
| Web Push (VAPID) | VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY | Browser push notifications (PWA) |

### CRM & Project Management

| Vendor | Env Variable(s) | What it does |
|--------|-----------------|-------------|
| HubSpot | HUBSPOT_API_KEY | CRM lead capture, contact sync |
| Jira | JIRA_API_TOKEN, JIRA_EMAIL, JIRA_URL | Ticket escalation to Jira projects |

### Social Media

| Vendor | Env Variable(s) | What it does |
|--------|-----------------|-------------|
| Twitter / X | TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, TWITTER_BEARER_TOKEN | Auto-posting, social engagement polling |
| LinkedIn | LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN | Auto-posting content |
| Facebook | FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN | Auto-posting to Facebook page |

### Infrastructure & Monitoring

| Vendor | Env Variable(s) | What it does |
|--------|-----------------|-------------|
| Cloudflare | CLOUDFLARE_API_TOKEN | WAF management, DNS, zone rules |
| UptimeRobot | UPTIMEROBOT_API_KEY | Monitor uptime status dashboard |
| AWS S3 | (via Manus platform) | File/asset storage (@aws-sdk/client-s3) |

### Manus Platform (Built-in)

| Service | Env Variable(s) | What it does |
|---------|-----------------|-------------|
| Manus OAuth | VITE_APP_ID, OAUTH_SERVER_URL, VITE_OAUTH_PORTAL_URL | User authentication (login/logout/session) |
| Manus LLM | BUILT_IN_FORGE_API_KEY, BUILT_IN_FORGE_API_URL | AI chat, KB generation, ticket triage, image generation |
| Manus Notifications | (same Forge keys) | Owner alert notifications |
| Manus Storage | (same Forge keys) | S3-backed file storage helpers |
| Manus Maps | (proxied, no key needed) | Google Maps — full API access via proxy |

---

## 4. Real-Time & WebSocket

| Technology | Package | Purpose |
|-----------|---------|---------|
| Socket.io | socket.io + socket.io-client | Real-time chat, typing indicators, read receipts |
| WebRTC | Browser native + ws | Peer-to-peer video/audio calls |
| ws | ws ^8.20.0 | Raw WebSocket server for signaling |

---

## 5. Key Frontend Libraries

| Library | Purpose |
|---------|---------|
| React Helmet Async | Dynamic <head> / SEO meta tags |
| Axios | Used in a few legacy integrations (social poller) |
| date-fns | Date formatting and manipulation |
| nanoid | Short unique ID generation |
| bcryptjs | Password hashing |
| jose | JWT signing and verification |
| canvas | Server-side image rendering |
| highlight.js + lowlight | Code syntax highlighting in KB/blog |
| Multer | File upload middleware |

---

## 6. Feature → Vendor Mapping (Quick Reference)

| Feature | Vendors / APIs Used |
|---------|-------------------|
| User authentication | Manus OAuth |
| AI chat & KB generation | Manus LLM (GPT-4 class) |
| Ticket classification | Microsoft Copilot Studio |
| Email to ticket | SendGrid inbound + MS Graph |
| Teams notifications | Teams Webhooks + Bot Framework |
| Phone / voice calls | Twilio + ACS |
| SMS alerts | Twilio |
| Push notifications | Web Push (VAPID) |
| Social auto-posting | Twitter, LinkedIn, Facebook APIs |
| M365 health monitoring | Microsoft Graph |
| Uptime monitoring | UptimeRobot |
| File storage | AWS S3 (via Manus) |
| Maps | Google Maps (via Manus proxy) |
| CRM / leads | HubSpot |
| Project escalation | Jira |
| WAF / DNS | Cloudflare |
| Video calls | WebRTC + Socket.io signaling |
| Blog / newsletter | Internal DB + SendGrid |
| Call recording & transcription | ACS + Whisper AI |
| Voicemail processing | Email poller + Whisper AI + Teams webhooks |

---

## 7. What to Reuse on New Client Sites

When engineering a new MSP or enterprise client site, this is the minimum portable stack:

### Always Include:
- React 19 + Tailwind 4 + Vite 7 + TypeScript 5.9
- tRPC 11 + TanStack Query 5 + Drizzle ORM + MySQL
- shadcn/ui + Radix UI + Lucide React
- Manus OAuth (auth) + Manus LLM (AI features)
- Sonner (toasts) + React Hook Form + Zod (forms)
- Vitest (tests)

### Add Per Client Need:
- Microsoft Graph → M365 clients
- Teams Webhooks → clients using Teams for ops
- Twilio → clients needing SMS/voice
- SendGrid → any email automation
- HubSpot → CRM-connected lead gen sites
- UptimeRobot → status pages
- Cloudflare → WAF + DNS management

---

## 8. GigitekAI-Specific Configurations

### Phone Numbers
- **Main Helpdesk:** (727) 382-6909 (with business and after-hours voicemail)
- **Teams Integration:** Direct Routing via ACS
- **Recording:** Automatic via ACS Event Grid → Whisper AI transcription

### Helpdesk Automation
- **Voicemail → Ticket Pipeline:** Email poller detects voicemail emails → extracts audio → transcribes via Whisper → creates ticket → sends email + Teams notification
- **PSTN Call Recording:** ACS captures calls → Event Grid webhook fires → downloads recording → transcribes → updates call review page
- **Teams Notifications:** Multi-channel routing (general_support, security, billing, etc.) with retry logic

### Key Endpoints
- Admin: `/admin/helpdesk`, `/admin/call-review`, `/admin/teams-health`
- Public: `/`, `/services`, `/industries`, `/blog`
- API: `/api/trpc`, `/api/acs/recording-webhook`, `/api/teams/webhook`

---

## 9. Deployment & Hosting

- **Platform:** Manus (managed hosting with built-in OAuth, LLM, storage)
- **Domains:** gigitekai.com, www.gigitekai.com, ggai.llc, www.ggai.llc, hh.gigitekai.com, seo.gigitekai.com
- **Database:** MySQL (TiDB compatible)
- **CI/CD:** Git-based (GitHub integration)
- **SSL/TLS:** Automatic via Manus platform

---

## 10. Performance & Optimization

- **PageSpeed Target:** Desktop 85+, Mobile 75+
- **Key Optimizations:**
  - Composited animations only (transition-[opacity,transform], transition-colors)
  - Lazy-loaded admin components (MSAL, Radix UI, markdown)
  - Image dimensions specified (width/height/decoding="async")
  - Code-split by route
  - Vite chunk splitting configured

---

## 11. Testing Strategy

- **Unit Tests:** Vitest for server procedures, utilities, auth logic
- **Integration Tests:** Call transcription pipeline, email poller, Teams webhooks
- **E2E:** Browser-based testing of critical flows (login, ticket creation, voicemail processing)
- **Coverage Target:** 80%+ for critical paths

---

## 12. Security & Compliance

- **Auth:** Manus OAuth + JWT sessions
- **Data:** Encrypted at rest (MySQL) and in transit (TLS)
- **Secrets:** Environment variables only (no hardcoded keys)
- **Compliance:** HIPAA-ready, SOC 2 compatible, PCI-DSS for payment processing
- **API Security:** tRPC with type-safe validation, protected procedures for admin routes

---

**Last Updated:** May 22, 2026  
**Maintained By:** GigitekAI Engineering Team
