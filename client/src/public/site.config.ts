/**
 * Public marketing site configuration.
 *
 * Single source of truth for brand, navigation, contact details, services and
 * FAQ copy used by the public site (client/src/public). Edit here; do not
 * hard-code these values in components.
 *
 * NOTE: This file is also imported by the build-time prerender script and the
 * server-side SEO middleware, so keep it free of browser-only code.
 */

export const SITE = {
  name: "GigitekAI",
  legalName: "GigitekAI LLC",
  url: "https://gigitekai.com",
  tagline: "AI-first managed IT, Microsoft 365, cybersecurity, and cloud for businesses.",
  description:
    "GigitekAI helps businesses run dependable IT, strengthen security, and automate repetitive work. Managed IT, Microsoft 365, AI agents, cybersecurity, and cloud from one accountable partner.",
  /** Default social preview image (existing approved asset). */
  ogImage:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-social-share-PcGTfHXSqszP86JZVvvsxv.png",
  logo: {
    src: "/gigitekai-wordmark.webp",
    fallback: "/gigitekai-wordmark.png",
    width: 490,
    height: 124,
    alt: "GigitekAI",
  },
  region: "Tampa Bay, Florida",
  serviceArea: "Businesses across North America and Canada",
} as const;

export const CONTACT = {
  email: "support@gigitekai.com",
  /** Confirmed by owner (Nov 2026). The old contact page showed (727) 382-6909; that number is retired. */
  phoneDisplay: "609-676-4483",
  phoneHref: "tel:+16096764483",
} as const;

export const SOCIAL = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gigitekai" },
  { label: "YouTube", href: "https://www.youtube.com/@gigitekai" },
] as const;

export const NAV = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const NAV_CTA = { label: "Talk to GigitekAI", href: "/contact" } as const;

/**
 * Operational links that must stay reachable but are secondary to marketing
 * navigation. These routes are served by the existing application, not by the
 * public site bundle.
 */
export const OPERATIONAL_LINKS = [
  { label: "Client Support", href: "/support" },
  { label: "Knowledge Base", href: "/kb" },
] as const;

export type ServiceSlug = "managed" | "microsoft-365" | "ai" | "security" | "cloud";

export interface ServiceFaq {
  q: string;
  a: string;
}

export interface Service {
  slug: ServiceSlug;
  /** Short name used in cards, nav and footer. */
  name: string;
  /** Page <h1>. */
  headline: string;
  /** Card copy (home + services overview). */
  summary: string;
  /** Hero supporting copy on the detail page. */
  intro: string;
  /** Icon key (see components/Icon.tsx). */
  icon: "monitor" | "grid" | "workflow" | "shield" | "cloud";
  problems: { title: string; body: string }[];
  scope: { title: string; body: string }[];
  outcomes: string[];
  approach: { title: string; body: string }[];
  faqs: ServiceFaq[];
  ctaHeadline: string;
  ctaBody: string;
  seo: { title: string; description: string };
}

export const SERVICES: Service[] = [
  {
    slug: "managed",
    name: "Managed IT Services",
    headline: "IT that stays out of your way.",
    summary:
      "Keep your business technology running with responsive support, proactive maintenance, and coordinated IT management.",
    intro:
      "Helpdesk, device management, patching, monitoring, and vendor coordination — delivered as one managed service with clear ownership, so your team can get on with work.",
    icon: "monitor",
    problems: [
      { title: "Nobody owns the whole picture", body: "Support, licensing, security, and vendors handled by different people with no coordination." },
      { title: "Problems repeat", body: "The same issues come back because root causes are never addressed." },
      { title: "Updates and backups slip", body: "Patching, backups, and renewals depend on someone remembering." },
      { title: "Growth outpaces IT", body: "New hires, new locations, and new tools arrive faster than the environment can absorb them." },
    ],
    scope: [
      { title: "Helpdesk support", body: "A single place for your team to get help, with tickets tracked to resolution." },
      { title: "Device and endpoint management", body: "Standard builds, patching, encryption, and inventory for laptops, desktops, and mobile devices." },
      { title: "Monitoring and maintenance", body: "Proactive checks on servers, network, Microsoft 365, and backups." },
      { title: "User lifecycle", body: "Onboarding and offboarding handled consistently, including access removal." },
      { title: "Vendor coordination", body: "We work with your ISP, software vendors, and line-of-business providers so you don't have to." },
      { title: "Reporting and planning", body: "Regular reviews of what happened, what's at risk, and what to plan for next." },
    ],
    outcomes: [
      "Fewer interruptions and faster resolution when they happen",
      "A documented, standardized environment",
      "Predictable monthly operations instead of emergency projects",
      "One accountable team for support, security, and planning",
    ],
    approach: [
      { title: "Onboard", body: "Document the environment, standardize devices and access, and agree on what's in scope." },
      { title: "Operate", body: "Run support, maintenance, and monitoring under ITIL-informed service management." },
      { title: "Review", body: "Regular service reviews, risk updates, and a rolling plan for improvements." },
    ],
    faqs: [
      { q: "Can you work alongside our existing IT person or team?", a: "Yes. We can take specific responsibilities — helpdesk, Microsoft 365, security — or co-manage the environment with your internal team." },
      { q: "Do you support remote and hybrid staff?", a: "Yes. Device management, identity, and support are designed for people working anywhere." },
      { q: "What about response times?", a: "Response targets are agreed in your service agreement based on the scope we take on. We don't publish blanket SLA claims." },
    ],
    ctaHeadline: "Let's take IT off your plate.",
    ctaBody: "Tell us what your environment looks like today and we'll suggest a practical scope.",
    seo: {
      title: "Managed IT Services | GigitekAI",
      description: "Managed IT with helpdesk, device management, patching, monitoring, and vendor coordination — one accountable team for your business technology.",
    },
  },
  {
    slug: "microsoft-365",
    name: "Microsoft 365",
    headline: "Microsoft 365, run properly.",
    summary:
      "Improve the way your team works with secure Microsoft 365 architecture, administration, migration, and optimization.",
    intro:
      "Architecture, administration, migration, governance, and security for the platform your team works in every day — from someone who has done it at enterprise scale.",
    icon: "grid",
    problems: [
      { title: "Identity and access sprawl", body: "Too many admins, stale accounts, and MFA gaps nobody owns." },
      { title: "Migrations that stall", body: "Tenant-to-tenant, on-premises Exchange, or Google Workspace moves without a clean plan." },
      { title: "Collaboration chaos", body: "Teams and SharePoint grown without structure, retention, or guardrails." },
      { title: "Paying for what you don't use", body: "Licensing that no longer matches how your people actually work." },
    ],
    scope: [
      { title: "Identity", body: "Entra ID design, Conditional Access, MFA, privileged roles, and lifecycle." },
      { title: "Collaboration", body: "Exchange Online, Teams, SharePoint, and OneDrive configured for how your team works." },
      { title: "Migration", body: "Planning, coexistence, cutover, and validation for mail, files, and identities." },
      { title: "Governance and security", body: "Retention, sharing controls, Defender, and compliance settings aligned to your requirements." },
      { title: "Administration and cost", body: "Ongoing administration, health monitoring, and license optimization." },
    ],
    outcomes: [
      "A tenant you understand and can audit",
      "Migrations completed with minimal disruption",
      "Collaboration tools people actually use, with sensible guardrails",
      "Licensing aligned to real usage",
    ],
    approach: [
      { title: "Assess", body: "Review the tenant, identities, licensing, and risks." },
      { title: "Implement", body: "Agreed scope, change windows, and clear communication." },
      { title: "Operate", body: "Administration, monitoring, and continuous improvement." },
    ],
    faqs: [
      { q: "Can you work with our existing licenses?", a: "Yes. We start from what you have and recommend changes only where they solve a real problem or reduce cost." },
      { q: "Do you handle tenant-to-tenant migrations?", a: "Yes — including mergers, divestitures, and consolidations, with coexistence planning and validation." },
      { q: "Is this a project or ongoing support?", a: "Either. Many clients start with a migration or assessment project and continue with ongoing administration." },
    ],
    ctaHeadline: "Talk to someone who has run Microsoft 365 at scale.",
    ctaBody: "Tell us where your tenant is today. We'll suggest a practical next step.",
    seo: {
      title: "Microsoft 365 Architecture, Migration & Administration | GigitekAI",
      description: "Microsoft 365 identity, collaboration, migration, governance, security, and cost optimization for businesses — designed and run by an experienced M365 architect.",
    },
  },
  {
    slug: "ai",
    name: "AI Agents & Automation",
    headline: "Put AI to work on the tasks that slow your team down.",
    summary:
      "Reduce repetitive work with practical AI agents and connected workflows designed around real business processes.",
    intro:
      "Start with the repetitive work: onboarding steps, routine requests, document handling, and updates between systems. We design automation around your process, with access controls and human approval where the work requires it.",
    icon: "workflow",
    problems: [
      { title: "Manual handoffs", body: "Information re-typed between email, spreadsheets, and business systems." },
      { title: "Routine requests eat the day", body: "Password resets, access requests, and status questions that follow the same steps every time." },
      { title: "Documents nobody processes", body: "Forms, invoices, and reports that wait for a person to read, file, or summarize them." },
      { title: "Unsupervised AI experiments", body: "Tools adopted without access controls, approvals, or anyone accountable for the output." },
    ],
    scope: [
      { title: "Workflow discovery", body: "Identify repetitive work, map the current process, and agree on what good looks like." },
      { title: "Agent and workflow design", body: "Define what the agent does, what it may access, and where a person approves." },
      { title: "Integrations", body: "Connect Microsoft 365, ticketing, and line-of-business systems through supported APIs." },
      { title: "Controls and monitoring", body: "Least-privilege access, logging, and review so output stays accountable." },
      { title: "Ongoing ownership", body: "Maintain, measure, and improve the automation as your process changes." },
    ],
    outcomes: [
      "Less repetitive work for your team",
      "Consistent handling of routine requests",
      "Automation you can explain, audit, and switch off",
      "A clear owner for every workflow",
    ],
    approach: [
      { title: "Discover", body: "Pick one workflow with a measurable outcome." },
      { title: "Build", body: "Implement with approvals, access controls, and testing." },
      { title: "Run", body: "Monitor, measure, and extend to the next workflow." },
    ],
    faqs: [
      { q: "What does a first AI project look like?", a: "One well-defined workflow — for example, routing and drafting responses to routine support requests — with a human approving before anything is sent." },
      { q: "Which platforms do you use?", a: "We work within the tools you already run, including Microsoft 365 and Copilot, and connect them through supported APIs. The platform choice follows the workflow, not the other way round." },
      { q: "Is our data used to train models?", a: "We design around the data-handling terms of the services involved and your own policies. Access is scoped, logged, and reviewed." },
    ],
    ctaHeadline: "Have a workflow in mind?",
    ctaBody: "Describe the repetitive work and we'll tell you whether automation is a sensible fit.",
    seo: {
      title: "AI Agents & Workflow Automation for Business | GigitekAI",
      description: "Practical AI agents and connected workflows designed around real business processes, with access controls, approvals, and human accountability.",
    },
  },
  {
    slug: "security",
    name: "Cybersecurity & Backup",
    headline: "Layered protection. Tested recovery.",
    summary:
      "Strengthen identity, email, endpoints, and recovery with layered protection and a Zero Trust approach.",
    intro:
      "Identity, email, endpoint, and backup protection designed together, following NIST-aligned practices and Zero Trust principles — so one weak link doesn't become an incident.",
    icon: "shield",
    problems: [
      { title: "Phishing and account takeover", body: "Email is still the most common way in, and weak MFA makes it easy." },
      { title: "Unmanaged devices", body: "Laptops without encryption, patching, or endpoint protection." },
      { title: "Backups nobody has restored", body: "Backup jobs that run, but have never been tested end to end." },
      { title: "Compliance questions you can't answer", body: "Customers, insurers, and auditors asking for evidence you don't have." },
    ],
    scope: [
      { title: "Identity protection", body: "MFA, Conditional Access, privileged access, and account hygiene." },
      { title: "Email security", body: "Advanced phishing and malware protection, plus SPF, DKIM, and DMARC." },
      { title: "Endpoint protection", body: "Managed detection and response, encryption, and patching for every device." },
      { title: "Backup and recovery", body: "Microsoft 365 and server backup with documented, tested restore procedures." },
      { title: "Security awareness and policy", body: "Practical policies and training people will actually follow." },
      { title: "Compliance support", body: "Help meeting requirements such as CMMC, HIPAA, or cyber-insurance questionnaires. We support your compliance; we don't certify it." },
    ],
    outcomes: [
      "Fewer successful phishing attempts",
      "Every device protected and accounted for",
      "Recovery you have actually tested",
      "Evidence ready when someone asks",
    ],
    approach: [
      { title: "Assess", body: "Review identity, email, endpoints, and backups against a practical baseline." },
      { title: "Harden", body: "Close the gaps in priority order, with change windows your business can live with." },
      { title: "Maintain", body: "Monitor, respond, and re-test recovery on a schedule." },
    ],
    faqs: [
      { q: "Will this make us compliant?", a: "We help you implement and document controls that compliance frameworks require. Certification or attestation is a separate process with an assessor; we don't guarantee it." },
      { q: "Do we need all of this at once?", a: "No. We prioritize by risk — usually identity and email first — and build from there." },
      { q: "What happens during an incident?", a: "Managed endpoint and email protection includes detection and response. The response process and who is involved is agreed in your service plan." },
    ],
    ctaHeadline: "Find out where you're exposed.",
    ctaBody: "Tell us what you have in place and we'll point out the gaps that matter most.",
    seo: {
      title: "Cybersecurity, Identity & Backup Services | GigitekAI",
      description: "Layered security for identity, email, endpoints, and backup with a Zero Trust approach and NIST-aligned practices. Tested recovery, practical policy.",
    },
  },
  {
    slug: "cloud",
    name: "Cloud Infrastructure",
    headline: "Cloud that fits the business, not the other way round.",
    summary:
      "Plan, modernize, and manage cloud environments across Azure, AWS, and Google Cloud.",
    intro:
      "Architecture, migration, operations, resilience, and cost management across Microsoft Azure, AWS, and Google Cloud — with decisions based on what your workloads actually need.",
    icon: "cloud",
    problems: [
      { title: "Aging on-premises servers", body: "Hardware past its life, with no clear plan for what replaces it." },
      { title: "Cloud bills nobody understands", body: "Resources left running, oversized, or duplicated across accounts." },
      { title: "No resilience plan", body: "Single points of failure with no tested failover or recovery." },
      { title: "Mixed environments", body: "Workloads spread across providers without consistent identity, networking, or monitoring." },
    ],
    scope: [
      { title: "Architecture and planning", body: "Choose the right landing zone, networking, and identity model for each workload." },
      { title: "Migration and modernization", body: "Move servers, file services, and applications with a tested cutover plan." },
      { title: "Operations", body: "Monitoring, patching, backups, and access management for cloud resources." },
      { title: "Resilience", body: "Backup, replication, and recovery designed to the availability your business needs." },
      { title: "Cost management", body: "Right-sizing, reservations, and ongoing review so spend matches use." },
    ],
    outcomes: [
      "A documented environment with a clear owner",
      "Workloads placed where they run best",
      "Resilience matched to business need",
      "Cloud spend you can explain",
    ],
    approach: [
      { title: "Plan", body: "Inventory workloads, dependencies, and requirements; agree on the target design." },
      { title: "Migrate", body: "Move in stages with validation at each step." },
      { title: "Operate", body: "Run, monitor, and optimize as needs change." },
    ],
    faqs: [
      { q: "Which cloud should we use?", a: "It depends on your workloads and existing investments. Many Microsoft 365 businesses are well served by Azure, but we design for AWS and Google Cloud where they fit better." },
      { q: "Will the cloud save us money?", a: "Sometimes. It depends on the workload and how it's managed. We model costs before recommending a move rather than promising savings." },
      { q: "Can you manage what we already have?", a: "Yes. We take over operations of existing environments and improve them incrementally." },
    ],
    ctaHeadline: "Ready to modernize?",
    ctaBody: "Tell us what you're running today and we'll outline sensible options.",
    seo: {
      title: "Cloud Infrastructure & Modernization — Azure, AWS, Google Cloud | GigitekAI",
      description: "Cloud architecture, migration, operations, resilience, and cost management across Azure, AWS, and Google Cloud, planned around your workloads.",
    },
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export const WHY_POINTS = [
  { title: "Experienced technical leadership", body: "Rather than a disconnected collection of vendors." },
  { title: "Automation tied to outcomes", body: "Every AI workflow maps to a specific process and a measurable result." },
  { title: "Security designed in", body: "Responsible access and protection built into the implementation." },
  { title: "Clear ownership", body: "Communication and ongoing service management you can count on." },
] as const;

export const AI_USE_CASES = [
  "Employee onboarding steps",
  "Routine support requests",
  "Document handling and filing",
  "Updates between business systems",
] as const;

export const HOW_WE_WORK = [
  { title: "Understand the need", body: "Review your current environment, priorities, and business constraints." },
  { title: "Build the right solution", body: "Agree on scope, responsibilities, security requirements, and success measures." },
  { title: "Support and improve", body: "Keep the environment maintained and refine the work as your needs change." },
] as const;

/** Vendor ecosystem — names only; no logos or partner-tier claims. */
export const VENDORS = [
  "Microsoft",
  "Azure",
  "AWS",
  "Google Cloud",
  "Sherweb",
  "Afi",
  "Commvault",
  "ConnectSecure",
  "DefensX",
  "Harmony",
  "NordLayer",
  "NordPass",
  "NordStellar",
] as const;

export const HOME_FAQ: ServiceFaq[] = [
  {
    q: "Is GigitekAI a fit for my business?",
    a: "We work with small and mid-sized businesses that depend on Microsoft 365 and want one accountable partner for support, security, cloud, and automation. If your IT is handled by a mix of vendors and nobody owns the whole picture, we can help.",
  },
  {
    q: "We already have Microsoft 365. What can you help with?",
    a: "Identity and access, Teams and SharePoint structure, migrations, security configuration, governance, and licensing. Most tenants we see were set up quickly and never revisited.",
  },
  {
    q: "What does a practical AI project look like?",
    a: "One repetitive workflow with a measurable outcome — for example, routing routine requests or processing a specific type of document — built with access controls and a person approving where it matters.",
  },
  {
    q: "Can you work with our existing IT team?",
    a: "Yes. We can take on specific areas such as Microsoft 365 or security, or co-manage the environment alongside your internal staff.",
  },
  {
    q: "Is this a project or ongoing support?",
    a: "Both are available. Many clients start with a migration, assessment, or automation project and continue with managed services.",
  },
  {
    q: "How do we get started?",
    a: "Email or call us. We'll ask a few questions about your environment and priorities, then suggest a practical next step — no pressure, no automated sales sequence.",
  },
];

export const ABOUT = {
  headline: "Enterprise-quality IT, for businesses that don't have an enterprise IT department.",
  intro:
    "GigitekAI is a veteran- and family-owned managed services provider based in Tampa Bay, founded by Harry Henry and Brenda Henry.",
  paragraphs: [
    "Harry is a U.S. Army veteran and Microsoft 365 architect with more than 25 years of hands-on enterprise IT experience, including large-scale Exchange and Microsoft 365 migrations for global organizations. GigitekAI exists to bring that level of engineering discipline to small and mid-sized businesses.",
    "Our focus is practical technology that helps businesses operate more reliably, reduce risk, and automate repetitive work. When we use AI, it performs useful operational tasks with appropriate approvals, access controls, monitoring, and human accountability. We are not selling an unsupervised black box.",
    "We follow ITIL-informed service delivery, NIST-aligned security practices, and Zero Trust principles. These are how we work, not certification claims.",
  ],
  values: [
    { title: "Accountability", body: "One partner, clearly responsible for the outcome." },
    { title: "Plain communication", body: "Decisions explained in business terms, without jargon or pressure." },
    { title: "Security by design", body: "Access, protection, and recovery built into every implementation." },
    { title: "Practical automation", body: "AI applied to specific workflows with measurable results." },
  ],
  seo: {
    title: "About GigitekAI | Veteran-Owned, AI-First Managed IT",
    description: "GigitekAI is a veteran- and family-owned managed services provider in Tampa Bay led by a Microsoft 365 architect with 25+ years of enterprise IT experience.",
  },
} as const;

/** Per-route SEO for the public site. Used by the prerender script and server middleware. */
export const PAGE_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "GigitekAI — AI-First Managed IT, Microsoft 365, Security & Cloud",
    description: SITE.description,
  },
  "/services": {
    title: "Services | Managed IT, Microsoft 365, AI, Security, Cloud | GigitekAI",
    description:
      "Managed IT services, Microsoft 365 architecture and migration, AI agents and automation, cybersecurity and backup, and cloud infrastructure — planned together by one partner.",
  },
  "/about": ABOUT.seo,
  "/contact": {
    title: "Contact GigitekAI",
    description: `Talk to GigitekAI about managed IT, Microsoft 365, AI automation, security, or cloud. Email ${CONTACT.email} or call ${CONTACT.phoneDisplay}.`,
  },
  "/blog": {
    title: "Insights | GigitekAI",
    description: "Articles on managed IT, Microsoft 365, AI automation, cybersecurity, and cloud for business owners and IT leaders.",
  },
};
for (const s of SERVICES) PAGE_SEO[`/services/${s.slug}`] = s.seo;

/** Routes rendered by the public site bundle (exact paths; blog posts are matched by prefix). */
export const PUBLIC_SITE_ROUTES: string[] = ["/", "/services", "/about", "/contact", "/blog", ...SERVICES.map((s) => `/services/${s.slug}`)];
