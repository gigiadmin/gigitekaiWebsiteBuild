/**
 * Pricing FAQ KB Article Seed Script
 * Adds comprehensive pricing FAQ to the knowledge base for Aria
 */

import mysql from "mysql2/promise";

const pricingFAQ = {
  title: "Helpdesk Pricing FAQ",
  category: "Pricing & Sales",
  tier: 1,
  isPublished: true,
  content: `# GigitekAI Helpdesk Pricing FAQ

## Tier Comparison

### What's the difference between Essential, Professional, and Elite?

**Essential ($69/user/month)**
- Business hours support (8am–6pm)
- Remote troubleshooting
- Patch management & antivirus
- 24/7 monitoring
- 4-hour critical SLA
- Best for: Small teams with limited support needs

**Professional ($119/user/month) - MOST POPULAR**
- 24/7 live support
- Remote troubleshooting
- Patch management & antivirus
- 24/7 monitoring
- Backup & disaster recovery included
- 15-minute critical SLA
- Best for: Growing companies needing comprehensive support

**Elite ($189/user/month)**
- 24/7 live support
- Remote troubleshooting
- Patch management & antivirus
- 24/7 monitoring
- Immutable backup & disaster recovery
- Advanced threat detection / SOC
- vCIO strategic consulting (quarterly)
- Compliance support (HIPAA/SOC2)
- 15-minute critical SLA
- Best for: Enterprise clients with compliance requirements

## Pricing & Discounts

### Do you offer volume discounts?

Yes! We offer tiered volume discounts:
- **25–50 users**: 8% discount
- **50+ users**: 10% discount
- **Annual pre-pay**: Additional 10% discount (can combine with volume discount)

Example: 50 users on Professional tier with annual pre-pay
- Base: 50 × $119 × 12 = $71,400
- Volume discount (10%): -$7,140
- Annual pre-pay (10%): -$6,426
- **Total: $57,834/year** (20% savings!)

### What about onboarding costs?

Onboarding is $50 per user, but it's **waived for companies with 25+ seats**. This covers:
- Account setup and provisioning
- Device enrollment and configuration
- User training and documentation
- Initial security baseline

### Are there any hidden fees?

No. Our pricing is completely transparent:
- Flat monthly rate per user (no per-ticket charges)
- All features included in your tier
- No surprise add-ons
- Custom quotes available for unique requirements

### Can I switch tiers mid-year?

Yes! You can upgrade or downgrade at any time. Changes take effect on your next billing cycle. Most customers start with Professional and scale as needed.

## Service Details

### What's included in 24/7 support?

Our 24/7 support includes:
- Live chat, email, and phone support
- Remote desktop troubleshooting
- Account and access issue resolution
- Software installation and configuration
- Performance optimization
- Vendor coordination

### What's the difference between SLAs?

**Essential: 4-hour critical SLA**
- Critical issue = complete system outage or security incident
- Response within 4 hours during business hours
- Best effort outside business hours

**Professional & Elite: 15-minute critical SLA**
- Critical issue = complete system outage or security incident
- Response within 15 minutes, 24/7
- Dedicated support queue

### What about backup and disaster recovery?

**Professional includes:**
- Daily automated backups
- 30-day retention
- Cloud-based storage
- One-click restore capability

**Elite includes:**
- Immutable backups (can't be deleted by ransomware)
- 90-day retention
- Geo-redundant storage
- Advanced threat detection
- SOC monitoring

### Does your helpdesk cover Microsoft 365 Copilot?

Yes! All tiers include support for:
- Copilot deployment and licensing
- User training and adoption
- Troubleshooting Copilot issues
- Integration with your workflows

For advanced Copilot consulting, we offer our separate Copilot Launch Package.

## Minimum Commitments

### What's the minimum number of users?

All helpdesk tiers require a minimum of **10 users**. This allows us to provide consistent, high-quality support and maintain our SLAs.

### Can I start with fewer users?

For companies with fewer than 10 users, we offer custom pricing. Contact our sales team for a quote.

### What if my team grows?

You can add users at any time. Pricing is prorated based on when you add them during your billing cycle.

## Comparing with Other Providers

### How do you compare to other MSPs?

GigitekAI differentiates on:
- **AI-powered efficiency**: Our Aria AI handles 40% of tickets without human intervention
- **Microsoft focus**: Deep expertise in Microsoft 365, Teams, and Copilot
- **Transparent pricing**: No hidden per-ticket fees or surprise charges
- **Flexible SLAs**: 15-minute critical response on Professional tier
- **Included backup**: Professional and Elite tiers include backup & DR
- **Proactive monitoring**: 24/7 system monitoring included in all tiers

### Should I choose Essential, Professional, or Elite?

**Choose Essential if:**
- You have a small team (10–25 users)
- You can tolerate business-hours-only support
- You have minimal compliance requirements
- You manage backups independently

**Choose Professional if:**
- You need 24/7 support and faster response times
- You want included backup and disaster recovery
- You value peace of mind with comprehensive monitoring
- You're a growing company (25–100 users)

**Choose Elite if:**
- You have compliance requirements (HIPAA, SOC2, PCI-DSS)
- You need advanced threat detection and SOC monitoring
- You want strategic vCIO consulting
- You're an enterprise with 100+ users

## Getting Started

### How do I get a quote?

Share your details and we'll send a custom proposal:
- Company name and size
- Current IT setup
- Biggest IT challenges
- Preferred tier or requirements

### What's the contract term?

We offer flexible terms:
- Month-to-month (no lock-in)
- Annual commitment (10% discount)
- Multi-year agreements available

### How quickly can we get started?

Typically 1–2 weeks:
1. Contract signed
2. Onboarding (1 week)
3. Go-live and 24/7 support begins

### What if I'm not satisfied?

We're confident in our service. If you're not happy in the first 30 days, we'll work with you to resolve issues or discuss alternatives.

## Contact & Next Steps

Ready to learn more? Contact our sales team:
- **Email**: sales@gigitekai.com
- **Phone**: 609-676-4483
- **Chat**: Use Aria (this chat) to ask questions or request a quote

We'll follow up with a custom proposal tailored to your needs.`,
  resolutionTime: "5-15 minutes",
  difficulty: "Beginner",
};

async function seedPricingFAQ() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gigitekai",
  });

  try {
    // Check if FAQ already exists
    const [existing] = await connection.execute(
      "SELECT id FROM kbArticles WHERE title = ?",
      [pricingFAQ.title]
    );

    if (existing.length > 0) {
      console.log("✓ Pricing FAQ already exists, skipping...");
      return;
    }

    // Insert pricing FAQ
    const [result] = await connection.execute(
      `INSERT INTO kbArticles (title, content, category, tier, isPublished, resolutionTime, difficulty, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        pricingFAQ.title,
        pricingFAQ.content,
        pricingFAQ.category,
        pricingFAQ.tier,
        pricingFAQ.isPublished,
        pricingFAQ.resolutionTime,
        pricingFAQ.difficulty,
      ]
    );

    console.log("✓ Pricing FAQ KB article created successfully!");
    console.log(`  ID: ${result.insertId}`);
    console.log(`  Title: ${pricingFAQ.title}`);
    console.log(`  Category: ${pricingFAQ.category}`);
  } catch (error) {
    console.error("✗ Error seeding pricing FAQ:", error);
  } finally {
    await connection.end();
  }
}

seedPricingFAQ();
