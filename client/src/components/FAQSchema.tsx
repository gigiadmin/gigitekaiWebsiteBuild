import { useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

/**
 * FAQSchema — Injects FAQPage JSON-LD structured data for Google
 * featured snippet eligibility. Use on service pages with FAQ sections.
 */
export function FAQSchema({ faqs }: FAQSchemaProps) {
  useEffect(() => {
    const schemaId = "faq-schema-jsonld";
    document.getElementById(schemaId)?.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = schemaId;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
    document.head.appendChild(script);

    return () => {
      document.getElementById(schemaId)?.remove();
    };
  }, [faqs]);

  return null;
}

// Pre-built FAQ sets for each service page
export const SERVICE_FAQS: Record<string, FAQItem[]> = {
  managed: [
    {
      question: "What is a managed service provider (MSP)?",
      answer:
        "A managed service provider (MSP) is a company that remotely manages a customer's IT infrastructure and end-user systems. GigitekAI provides 24/7 monitoring, helpdesk support, cybersecurity, cloud management, and strategic IT consulting as a fully managed service.",
    },
    {
      question: "How much do managed IT services cost in Tampa Bay?",
      answer:
        "Managed IT services in Tampa Bay typically range from $100-$250 per user per month depending on the service level. GigitekAI offers transparent pricing with plans starting at $149/user/month including 24/7 support, monitoring, and cybersecurity.",
    },
    {
      question: "What is GigitekAI's uptime guarantee?",
      answer:
        "GigitekAI guarantees 99.9% uptime SLA across all managed services. This is backed by proactive monitoring, redundant infrastructure, and 24/7 AI-powered support that resolves most issues before they impact your business.",
    },
    {
      question: "Do you support remote and hybrid workforces?",
      answer:
        "Yes. GigitekAI specializes in Microsoft 365 architecture for remote and hybrid teams, including Teams deployment, Exchange Online, SharePoint, Intune device management, and Zero Trust security for distributed workforces.",
    },
    {
      question: "How quickly can GigitekAI respond to IT issues?",
      answer:
        "Our AI-powered helpdesk provides instant responses for common issues. For escalated tickets, our SLA guarantees 15-minute response time for critical issues and 1-hour for standard requests during business hours.",
    },
  ],
  "microsoft-365": [
    {
      question: "What Microsoft 365 services does GigitekAI provide?",
      answer:
        "GigitekAI provides complete Microsoft 365 architecture including Exchange Online migration, Teams deployment, SharePoint configuration, Intune device management, Copilot enablement, license optimization (saving 15-30%), and ongoing administration.",
    },
    {
      question: "How long does a Microsoft 365 migration take?",
      answer:
        "A typical M365 migration takes 2-6 weeks depending on the size of your organization and complexity. GigitekAI uses automated migration tools and a proven methodology to minimize downtime — most migrations complete with zero business disruption.",
    },
    {
      question: "Can you help reduce our Microsoft 365 licensing costs?",
      answer:
        "Yes. GigitekAI's license optimization audit typically saves businesses 15-30% on Microsoft 365 costs by right-sizing licenses, eliminating unused seats, and recommending the optimal license mix for your needs.",
    },
    {
      question: "Do you support Microsoft Copilot deployment?",
      answer:
        "Yes. GigitekAI is a Microsoft Copilot deployment specialist. We handle readiness assessments, data governance preparation, pilot programs, user training, and full enterprise rollouts of Microsoft 365 Copilot.",
    },
    {
      question: "What is the difference between Microsoft 365 Business and Enterprise plans?",
      answer:
        "Business plans (Basic, Standard, Premium) support up to 300 users and include core productivity apps. Enterprise plans (E3, E5) offer unlimited users, advanced security, compliance tools, and analytics. GigitekAI helps you choose the right plan based on your specific needs and budget.",
    },
  ],
  security: [
    {
      question: "What is Zero Trust security?",
      answer:
        "Zero Trust is a security framework that requires all users, devices, and applications to be verified before accessing resources — regardless of their location. GigitekAI implements Zero Trust using Microsoft Entra ID, Conditional Access, Intune, and Defender for Business.",
    },
    {
      question: "What cybersecurity frameworks does GigitekAI follow?",
      answer:
        "GigitekAI follows NIST Cybersecurity Framework, implements Zero Trust architecture, and supports compliance with HIPAA, SOC 2, PCI-DSS, and CMMC. Our security stack includes ConnectSecure, DefensX, Harmony/Avanan, and Microsoft Defender.",
    },
    {
      question: "How does GigitekAI protect against ransomware?",
      answer:
        "Our multi-layered approach includes email security (Harmony/Avanan), endpoint protection (Defender for Business), DNS filtering (DefensX), vulnerability scanning (ConnectSecure), backup and disaster recovery, and 24/7 AI-powered threat monitoring.",
    },
    {
      question: "Do you provide security awareness training?",
      answer:
        "Yes. GigitekAI provides ongoing security awareness training including phishing simulations, compliance training modules, and regular security briefings to keep your team vigilant against social engineering attacks.",
    },
    {
      question: "What happens if we experience a security breach?",
      answer:
        "GigitekAI provides 24/7 incident response. Our team immediately isolates affected systems, investigates the breach, remediates vulnerabilities, and provides a detailed post-incident report. We also handle regulatory notification requirements if applicable.",
    },
  ],
  cloud: [
    {
      question: "Which cloud platforms does GigitekAI support?",
      answer:
        "GigitekAI supports Microsoft Azure, Amazon Web Services (AWS), Google Cloud Platform, and hybrid cloud environments. We help businesses choose the right platform based on their workloads, compliance requirements, and budget.",
    },
    {
      question: "How long does a cloud migration take?",
      answer:
        "Cloud migrations typically take 4-12 weeks depending on complexity. GigitekAI uses a phased approach: assessment (1-2 weeks), planning (1-2 weeks), migration (2-6 weeks), and optimization (ongoing). Most businesses experience zero downtime during migration.",
    },
    {
      question: "What is GigitekAI's cloud uptime guarantee?",
      answer:
        "GigitekAI guarantees 99.99% availability for cloud infrastructure services. This is achieved through redundant architecture, automated failover, proactive monitoring, and 24/7 support.",
    },
    {
      question: "Can you help us reduce cloud costs?",
      answer:
        "Yes. GigitekAI's cloud optimization service typically reduces cloud spending by 20-40% through right-sizing instances, reserved capacity planning, auto-scaling configuration, and eliminating unused resources.",
    },
    {
      question: "Do you support hybrid cloud environments?",
      answer:
        "Yes. GigitekAI specializes in hybrid cloud architectures that connect on-premises infrastructure with cloud services. We use Azure Arc, AWS Outposts, and VPN/ExpressRoute connections to create seamless hybrid environments.",
    },
  ],
  ai: [
    {
      question: "How can AI automation help my business?",
      answer:
        "AI automation can reduce operational costs by up to 40%, free 280+ hours monthly for a typical 100-employee company, and provide 24/7 intelligent support. GigitekAI deploys AI agents for helpdesk, onboarding, security monitoring, and workflow automation.",
    },
    {
      question: "What is GigitekAI's AI helpdesk?",
      answer:
        "GigitekAI's AI helpdesk uses intelligent agents to automatically classify, route, and resolve Tier-1 IT tickets without human intervention. It handles password resets, access requests, common troubleshooting, and escalates complex issues to human technicians.",
    },
    {
      question: "How quickly can AI agents be deployed?",
      answer:
        "GigitekAI can deploy AI agents in 2-4 weeks. Our multi-system orchestrator can provision new clients across 8+ systems in approximately 3.4 seconds. Custom AI workflows are built iteratively with measurable ROI at each stage.",
    },
    {
      question: "Is AI automation secure?",
      answer:
        "Yes. GigitekAI's AI agents operate within Zero Trust security boundaries, follow least-privilege access principles, and maintain full audit trails. All AI operations are logged, monitored, and compliant with SOC 2 and HIPAA requirements.",
    },
    {
      question: "What ROI can I expect from AI automation?",
      answer:
        "GigitekAI clients typically see 3-4 month payback periods, 40% reduction in operational costs, 10x faster deployment of AI models, and 280+ hours freed monthly. Our ROI calculator at gigitekai.com/roi-calculator provides personalized estimates.",
    },
  ],
};

export default FAQSchema;
