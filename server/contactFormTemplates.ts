/*
 * contactFormTemplates.ts — Tier-specific email templates for contact form submissions
 * 
 * Auto-sends different follow-up emails based on the selected pricing tier:
 * - Starter: Quick-start guide, basic features overview
 * - Professional: ROI calculator, case studies, implementation timeline
 * - Enterprise: Custom proposal, dedicated account manager, security audit
 */

export type ContactFormEmailData = {
  name: string;
  email: string;
  company: string;
  pricingTier?: string;
  companySize?: string;
  subject: string;
  message: string;
  submittedAt: string;
};

/**
 * Build tier-specific contact form response email
 */
export function buildContactFormResponseEmail(data: ContactFormEmailData): { subject: string; html: string } {
  const tierTemplates: Record<string, { subject: string; title: string; description: string; cta: string; resources: string[] }> = {
    starter: {
      subject: "Let's Get You Started with GigitekAI — Quick Setup Guide",
      title: "Welcome to GigitekAI, {{name}}!",
      description: "We've received your interest in our Starter tier. Perfect for small teams looking to modernize their IT infrastructure without the complexity.",
      cta: "Download our Quick-Start Guide",
      resources: [
        "📋 Starter Tier Feature Overview (PDF)",
        "⚡ 30-Day Implementation Roadmap",
        "💰 Transparent Pricing Breakdown",
      ],
    },
    professional: {
      subject: "Your Professional Tier Proposal — ROI & Implementation Plan",
      title: "Let's Build Your Growth Strategy, {{name}}",
      description: "Your company is ready for our Professional tier. We've prepared a customized ROI analysis and 90-day implementation timeline tailored to {{company}}'s needs.",
      cta: "View Your Custom ROI Calculator",
      resources: [
        "📊 ROI Calculator (Interactive)",
        "📈 Case Study: Similar-Sized Company (+40% efficiency)",
        "🎯 90-Day Implementation Timeline",
        "👥 Dedicated Account Manager Assignment",
      ],
    },
    enterprise: {
      subject: "Enterprise Proposal — Custom Architecture & Security Audit",
      title: "Welcome to Enterprise Partnership, {{name}}",
      description: "{{company}} qualifies for our full Enterprise suite. Our team is preparing a comprehensive security audit, custom architecture design, and dedicated support plan.",
      cta: "Schedule Your Security Audit",
      resources: [
        "🔐 Complimentary Security Assessment",
        "🏗️ Custom Architecture Design (Zero Trust Framework)",
        "📋 SLA & Service Level Guarantees",
        "👔 Dedicated Account Manager + Technical Lead",
        "🌐 24/7 Priority Support",
      ],
    },
  };

  const tier = data.pricingTier || "professional";
  const template = tierTemplates[tier] || tierTemplates.professional;

  const subject = template.subject.replace("{{name}}", data.name);
  const title = template.title.replace("{{name}}", data.name);
  const description = template.description
    .replace("{{name}}", data.name)
    .replace("{{company}}", data.company || "your organization");

  const resourcesList = template.resources
    .map((resource) => `<li style="margin-bottom:12px;color:#e0e0e0;font-size:15px;line-height:1.6;">${resource}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0E1A;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0E1A;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Content container -->
        <table width="100%" maxwidth="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#0F1419;border:1px solid rgba(0,212,255,0.1);border-radius:12px;overflow:hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg, #0A0E1A 0%, #1a1f2e 100%);padding:40px 32px;text-align:center;border-bottom:2px solid #00D4FF;">
              <div style="font-size:28px;font-weight:700;color:#00D4FF;margin-bottom:8px;">GigitekAI</div>
              <div style="font-size:14px;color:#888;letter-spacing:1px;text-transform:uppercase;">Thank You for Your Interest</div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:40px 32px;">
              
              <!-- Greeting -->
              <div style="margin-bottom:24px;">
                <h1 style="margin:0;font-size:24px;font-weight:600;color:#FFFFFF;line-height:1.4;">
                  ${title}
                </h1>
              </div>

              <!-- Description -->
              <p style="margin:0 0 24px 0;font-size:15px;color:#B0B0B0;line-height:1.7;">
                ${description}
              </p>

              <!-- Tier badge -->
              <div style="margin:24px 0;padding:16px;background-color:rgba(0,212,255,0.05);border-left:4px solid #00D4FF;border-radius:4px;">
                <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Your Selected Tier</div>
                <div style="font-size:18px;font-weight:600;color:#00D4FF;text-transform:capitalize;">
                  ${tier} Plan
                </div>
              </div>

              <!-- Resources section -->
              <div style="margin:32px 0;">
                <h2 style="margin:0 0 16px 0;font-size:16px;font-weight:600;color:#FFFFFF;">What's Included:</h2>
                <ul style="margin:0;padding:0;list-style:none;">
                  ${resourcesList}
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="margin:32px 0;text-align:center;">
                <a href="https://gigitekai.com/contact" style="display:inline-block;background-color:#00D4FF;color:#000;padding:14px 32px;font-weight:600;text-decoration:none;border-radius:6px;font-size:15px;transition:background-color 0.3s;">
                  ${template.cta}
                </a>
              </div>

              <!-- Next steps -->
              <div style="margin:32px 0;padding:20px;background-color:rgba(0,212,255,0.03);border-radius:6px;">
                <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#FFFFFF;">What Happens Next:</h3>
                <ol style="margin:0;padding-left:20px;color:#B0B0B0;font-size:14px;line-height:1.8;">
                  <li>Our team reviews your submission within 2 hours</li>
                  <li>You'll receive a personalized proposal within 24 hours</li>
                  <li>We'll schedule a discovery call at your convenience</li>
                </ol>
              </div>

              <!-- Contact info -->
              <div style="margin:32px 0;padding:20px;background-color:rgba(0,212,255,0.02);border-radius:6px;border:1px solid rgba(0,212,255,0.1);">
                <p style="margin:0 0 12px 0;font-size:14px;color:#B0B0B0;">
                  <strong style="color:#FFFFFF;">Questions?</strong> Reach out anytime:
                </p>
                <p style="margin:0;font-size:14px;">
                  <a href="tel:7273825776" style="color:#00D4FF;text-decoration:none;">📞 (727) 382-5776</a> •
                  <a href="mailto:support@gigitekai.com" style="color:#00D4FF;text-decoration:none;">📧 support@gigitekai.com</a>
                </p>
              </div>

              <!-- Signature -->
              <div style="margin:32px 0 0 0;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);">
                <p style="margin:0;font-size:14px;color:#B0B0B0;">
                  Best regards,<br/>
                  <strong style="color:#FFFFFF;">The GigitekAI Team</strong><br/>
                  <span style="font-size:12px;color:#888;">Microsoft 365 Architects • AI-First MSP</span>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0A0E1A;padding:24px 32px;text-align:center;border-top:1px solid rgba(0,212,255,0.1);">
              <p style="margin:0;font-size:12px;color:#666;">
                You received this email because you submitted a contact form at gigitekai.com<br/>
                <a href="https://gigitekai.com" style="color:#00D4FF;text-decoration:none;">Visit our website</a> • 
                <a href="https://gigitekai.com/contact" style="color:#00D4FF;text-decoration:none;">Update preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return { subject, html };
}

/**
 * Get tier-specific follow-up resources (for reference in admin dashboard)
 */
export function getTierResources(tier: string = "professional"): {
  name: string;
  description: string;
  resources: Array<{ title: string; url: string; type: string }>;
} {
  const resources: Record<string, any> = {
    starter: {
      name: "Starter Tier Resources",
      description: "Quick-start materials for small teams",
      resources: [
        { title: "Feature Overview", url: "/resources/starter-features.pdf", type: "PDF" },
        { title: "30-Day Roadmap", url: "/resources/starter-roadmap.pdf", type: "PDF" },
        { title: "Pricing Breakdown", url: "/resources/starter-pricing.pdf", type: "PDF" },
      ],
    },
    professional: {
      name: "Professional Tier Resources",
      description: "Growth-focused materials with ROI analysis",
      resources: [
        { title: "ROI Calculator", url: "/resources/roi-calculator.html", type: "Interactive" },
        { title: "Case Study", url: "/resources/case-study-professional.pdf", type: "PDF" },
        { title: "Implementation Timeline", url: "/resources/implementation-90day.pdf", type: "PDF" },
      ],
    },
    enterprise: {
      name: "Enterprise Tier Resources",
      description: "Comprehensive enterprise solutions",
      resources: [
        { title: "Security Assessment", url: "/resources/security-audit-checklist.pdf", type: "PDF" },
        { title: "Architecture Design", url: "/resources/zero-trust-framework.pdf", type: "PDF" },
        { title: "SLA Guarantees", url: "/resources/enterprise-sla.pdf", type: "PDF" },
      ],
    },
  };

  return resources[tier] || resources.professional;
}
