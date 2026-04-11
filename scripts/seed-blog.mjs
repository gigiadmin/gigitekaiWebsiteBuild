/**
 * Seed the 3 original GigitekAI blog posts into the database.
 * Run once: node scripts/seed-blog.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const posts = [
  {
    slug: "2026-enterprise-cloud-migration-playbook",
    title: "The 2026 Enterprise Cloud Migration Playbook: Avoiding the 5 Most Costly Mistakes",
    excerpt:
      "Cloud migrations fail not from technical complexity, but from poor planning. Here's how leading enterprises are approaching migration in 2026 to maximize ROI and minimize disruption.",
    content: `# The 2026 Enterprise Cloud Migration Playbook: Avoiding the 5 Most Costly Mistakes

Cloud migrations fail not from technical complexity, but from poor planning. Here's how leading enterprises are approaching migration in 2026 to maximize ROI and minimize disruption.

## Mistake #1: Skipping the Discovery Phase

Before moving a single workload, organizations must conduct a thorough discovery of their current environment. This includes cataloging all applications, dependencies, data flows, and compliance requirements. Rushing past this phase is the single most common cause of migration failures.

## Mistake #2: Lift-and-Shift Without Optimization

Simply rehosting on-premises VMs in the cloud without re-architecting leads to inflated cloud bills. The most successful migrations use a tiered approach: rehost low-complexity workloads, refactor business-critical applications, and rebuild legacy systems as cloud-native services.

## Mistake #3: Ignoring Security and Compliance

Cloud security is a shared responsibility. Many organizations incorrectly assume their cloud provider handles all security. A Zero Trust framework must be established before migration begins — not after.

## Mistake #4: Underestimating Change Management

Technology is the easy part. People and processes are the hard part. Invest in training, communication, and stakeholder alignment early. Resistance from IT staff and business units derails more migrations than technical issues.

## Mistake #5: No Rollback Plan

Every migration phase must have a tested rollback procedure. Define your success criteria, monitoring thresholds, and rollback triggers before you begin each wave.

## The GigitekAI Approach

At GigitekAI, we guide clients through a structured 5-phase migration framework: Assess, Plan, Migrate, Optimize, and Govern. Our AI-powered monitoring tools detect performance anomalies in real time, ensuring your migration stays on track.

Ready to start your cloud journey? [Contact our team](/contact) for a complimentary migration readiness assessment.`,
    category: "Cloud Strategy",
    readTime: "8 min read",
    authorName: "GigitekAI Team",
    published: true,
    publishedAt: new Date("2026-03-28"),
  },
  {
    slug: "generative-ai-reshaping-enterprise-operations",
    title: "How Generative AI is Reshaping Enterprise Operations: A Practical Guide for CTOs",
    excerpt:
      "Beyond the hype, generative AI is delivering measurable productivity gains across finance, HR, and customer service. We break down the use cases with the highest enterprise ROI.",
    content: `# How Generative AI is Reshaping Enterprise Operations: A Practical Guide for CTOs

Beyond the hype, generative AI is delivering measurable productivity gains across finance, HR, and customer service. We break down the use cases with the highest enterprise ROI.

## The Shift from Experimentation to Production

In 2025, most enterprises were running generative AI pilots. In 2026, the leaders have moved to production. The differentiator is not the AI model — it's the integration architecture and change management strategy.

## Highest-ROI Use Cases

### 1. IT Helpdesk Automation
AI agents handling Tier 1 and Tier 2 support tickets can reduce resolution time by 60–70% and cut support costs by 40%. GigitekAI's own AI helpdesk platform demonstrates this at scale.

### 2. Document Intelligence
Contract review, compliance documentation, and policy analysis are being transformed by large language models. Legal and compliance teams report 50%+ time savings on routine document work.

### 3. Code Generation and Review
Development teams using AI-assisted coding tools report 30–40% productivity improvements. The key is proper guardrails and human review workflows.

### 4. Customer Service Personalization
AI-powered customer service platforms can handle 80% of routine inquiries while escalating complex issues to human agents with full context — improving both efficiency and customer satisfaction.

## Implementation Framework

Successful enterprise AI deployment requires three pillars: **Data Governance** (clean, accessible, compliant data), **Integration Architecture** (APIs, security, monitoring), and **Human-in-the-Loop Design** (clear escalation paths and override mechanisms).

## What CTOs Should Do Now

1. Identify your top 3 manual workflows consuming the most staff hours
2. Evaluate AI automation ROI for each using a simple time-savings model
3. Run a 90-day pilot with measurable KPIs before scaling
4. Build an AI governance policy covering data privacy, bias mitigation, and audit trails

GigitekAI specializes in helping organizations move from AI experimentation to enterprise-grade AI operations. [Schedule a consultation](/contact) to discuss your AI roadmap.`,
    category: "Artificial Intelligence",
    readTime: "12 min read",
    authorName: "GigitekAI Team",
    published: true,
    publishedAt: new Date("2026-03-21"),
  },
  {
    slug: "zero-trust-architecture-age-of-ai",
    title: "Zero Trust Architecture in the Age of AI: Building Defenses That Learn and Adapt",
    excerpt:
      "Traditional perimeter security is obsolete. Discover how AI-powered Zero Trust frameworks are becoming the new standard for enterprise cloud security in 2026.",
    content: `# Zero Trust Architecture in the Age of AI: Building Defenses That Learn and Adapt

Traditional perimeter security is obsolete. Discover how AI-powered Zero Trust frameworks are becoming the new standard for enterprise cloud security in 2026.

## Why Perimeter Security Failed

The castle-and-moat model assumed that everything inside the network perimeter was trusted. Cloud computing, remote work, and SaaS applications destroyed that assumption. Today, the perimeter is everywhere — and nowhere.

## Zero Trust Principles

Zero Trust is built on three core principles:
1. **Never trust, always verify** — every access request is authenticated and authorized regardless of origin
2. **Least privilege access** — users and systems receive only the minimum permissions required
3. **Assume breach** — design systems as if attackers are already inside

## How AI Enhances Zero Trust

Traditional Zero Trust implementations rely on static policies. AI-powered Zero Trust adds dynamic, behavioral analysis:

### Continuous Authentication
AI models analyze user behavior patterns — typing rhythm, access patterns, location, device health — to continuously verify identity without friction. Anomalies trigger step-up authentication automatically.

### Threat Intelligence Integration
AI systems correlate internal telemetry with global threat intelligence feeds in real time, identifying indicators of compromise that static rules would miss.

### Automated Response
When AI detects a threat, automated response playbooks can isolate affected systems, revoke credentials, and alert security teams — all within seconds, not hours.

## The NIST Framework Alignment

GigitekAI's Zero Trust implementations align with NIST SP 800-207 and the CISA Zero Trust Maturity Model. This ensures your security posture meets federal and enterprise compliance requirements.

## Vendor Stack Considerations

Effective Zero Trust requires integration across your security stack. Key components include identity (Azure AD/Entra ID), endpoint security (DefensX), network security (NordLayer), and email security (Harmony/Avanan). GigitekAI manages all of these as part of our managed security service.

Ready to assess your Zero Trust maturity? [Contact GigitekAI](/contact) for a complimentary security posture review.`,
    category: "Cybersecurity",
    readTime: "10 min read",
    authorName: "GigitekAI Team",
    published: true,
    publishedAt: new Date("2026-03-14"),
  },
];

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seeding blog posts…");

  for (const post of posts) {
    // Check if post with this slug already exists
    const [existing] = await connection.execute(
      "SELECT id FROM blogPosts WHERE slug = ? LIMIT 1",
      [post.slug]
    );
    if (existing.length > 0) {
      console.log(`  SKIP  ${post.slug} (already exists)`);
      continue;
    }

    await connection.execute(
      `INSERT INTO blogPosts (slug, title, excerpt, content, category, readTime, authorName, published, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        post.slug,
        post.title,
        post.excerpt,
        post.content,
        post.category,
        post.readTime,
        post.authorName,
        post.published ? 1 : 0,
        post.publishedAt,
      ]
    );
    console.log(`  OK    ${post.slug}`);
  }

  await connection.end();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
