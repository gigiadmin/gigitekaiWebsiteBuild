/**
 * Centralized SEO configuration for every public page.
 * Each entry maps a route path to its unique title and meta description.
 */
export interface PageSEO {
  title: string;
  description: string;
}

export const SEO_CONFIG: Record<string, PageSEO> = {
  "/": {
    title: "GigitekAI — AI-Powered Managed Service Provider | Tampa Bay IT Services",
    description:
      "GigitekAI is Tampa Bay's AI-first managed service provider delivering enterprise cloud, Microsoft 365, cybersecurity, and AI automation. 99.9% uptime SLA, 24/7 support, 40% cost reduction. Free IT assessment — (727) 382-5776.",
  },
  "/about-us": {
    title: "About GigitekAI | Cloud & AI Technology Partner",
    description:
      "Founded in 2024 by a Microsoft 365 Architect with 20+ years of enterprise IT experience. GigitekAI modernizes businesses with AI-first managed services.",
  },
  "/our-team": {
    title: "Our Team | GigitekAI Cloud & AI Experts",
    description:
      "Meet the GigitekAI leadership team — seasoned IT professionals specializing in Microsoft 365, cybersecurity, cloud architecture, and AI automation.",
  },
  "/blog": {
    title: "Cloud & AI Insights Blog | GigitekAI",
    description:
      "Expert insights on cloud infrastructure, AI automation, Microsoft 365, cybersecurity, and digital transformation for modern businesses.",
  },
  "/contact": {
    title: "Contact GigitekAI — Free IT Assessment",
    description:
      "Get a free IT assessment from GigitekAI. Enterprise cloud, AI, and managed IT solutions. Call (727) 382-5776 or email support@gigitekai.com.",
  },
  "/pricing": {
    title: "IT Solutions Pricing | GigitekAI",
    description:
      "Transparent pricing for managed IT, cloud infrastructure, AI automation, and cybersecurity services. Custom plans for businesses of all sizes.",
  },
  "/helpdesk-pricing": {
    title: "Managed Helpdesk Pricing Plans | GigitekAI",
    description:
      "AI-powered helpdesk plans starting at competitive rates. 24/7 support, SLA guarantees, and intelligent ticket routing. Get a custom quote today.",
  },
  "/helpdesk": {
    title: "IT Support Helpdesk | GigitekAI",
    description:
      "Access GigitekAI's AI-powered helpdesk for fast, intelligent IT support. Create tickets, track issues, and get resolutions faster.",
  },
  "/services": {
    title: "Enterprise Cloud & AI Services | GigitekAI",
    description:
      "Explore GigitekAI's full suite of enterprise services: cloud infrastructure, AI automation, cybersecurity, managed IT, Microsoft 365, and data analytics.",
  },
  "/services/microsoft-365": {
    title: "Microsoft 365 Architecture & Migration | GigitekAI",
    description:
      "Expert M365 architecture, Exchange Online migration, Teams deployment, and license optimization from a certified Microsoft 365 Architect. 15-30% cost savings.",
  },
  "/services/managed": {
    title: "Managed IT Services | GigitekAI — Tampa Bay",
    description:
      "Proactive managed IT services for enterprise growth. 24/7 monitoring, 99.9% uptime SLA, and strategic IT consulting. Free assessment — (727) 382-5776.",
  },
  "/services/cloud": {
    title: "Cloud Infrastructure & Migration | GigitekAI",
    description:
      "Enterprise cloud migration and infrastructure services. Azure, AWS, and hybrid cloud solutions with 99.99% availability. Expert architecture and support.",
  },
  "/services/ai": {
    title: "AI & Machine Learning Solutions | GigitekAI",
    description:
      "Transform your business with AI automation, machine learning, and intelligent workflows. Custom AI solutions built for enterprise scale and ROI.",
  },
  "/services/security": {
    title: "Cybersecurity & Zero Trust Solutions | GigitekAI",
    description:
      "Enterprise cybersecurity with Zero Trust architecture, NIST compliance, and 24/7 threat monitoring. Protect your business from modern cyber threats.",
  },
  "/services/data": {
    title: "Data Analytics & BI Solutions | GigitekAI",
    description:
      "Turn data into actionable insights with business intelligence, analytics dashboards, and data-driven decision-making solutions from GigitekAI.",
  },
  "/services/strategy": {
    title: "IT Strategy & Growth Consulting | GigitekAI",
    description:
      "Strategic IT consulting and digital transformation planning. Align technology investments with business goals for measurable growth and ROI.",
  },
  "/partners": {
    title: "Technology Partners | GigitekAI",
    description:
      "GigitekAI partners with Microsoft, AWS, and leading security vendors to deliver best-in-class managed IT, cloud, and cybersecurity solutions.",
  },
  "/roi-calculator": {
    title: "IT ROI Calculator | GigitekAI",
    description:
      "Calculate your potential ROI from managed IT services, cloud migration, and AI automation. See how GigitekAI can reduce costs and improve efficiency.",
  },
  "/AIStrategicBriefing": {
    title: "AI Strategic Briefing | GigitekAI",
    description:
      "Discover how AI can transform your business operations. GigitekAI's strategic briefing covers automation, cost reduction, and competitive advantage.",
  },
  "/case-studies": {
    title: "Case Studies | GigitekAI — Real Results for Real Businesses",
    description:
      "See how GigitekAI delivers measurable results: M365 migrations, Zero Trust security, AI helpdesk automation, and hybrid cloud modernization across industries.",
  },
  "/industries/healthcare": {
    title: "Healthcare IT Solutions | GigitekAI",
    description:
      "HIPAA-compliant cloud, AI, and managed IT solutions for healthcare providers. Secure patient data and streamline clinical workflows.",
  },
  "/industries/financial-services": {
    title: "Financial Services IT Solutions | GigitekAI",
    description:
      "Secure, compliant IT solutions for financial services. SOC 2 compliance, data encryption, and AI-powered fraud detection from GigitekAI.",
  },
  "/industries/manufacturing": {
    title: "Manufacturing IT Solutions | GigitekAI",
    description:
      "Smart manufacturing IT solutions. IoT integration, predictive maintenance, and cloud infrastructure for modern manufacturing operations.",
  },
  "/industries/retail-ecommerce": {
    title: "Retail & E-Commerce IT Solutions | GigitekAI",
    description:
      "Scalable IT infrastructure for retail and e-commerce. Cloud hosting, AI-powered analytics, and cybersecurity for online businesses.",
  },
  "/industries/government": {
    title: "Government IT Solutions | GigitekAI",
    description:
      "FedRAMP-ready cloud and cybersecurity solutions for government agencies. Compliance-first IT modernization from GigitekAI.",
  },
  "/industries/education": {
    title: "Education IT Solutions | GigitekAI",
    description:
      "Cloud infrastructure and AI solutions for educational institutions. Secure, scalable, and cost-effective IT for schools and universities.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | GigitekAI",
    description:
      "GigitekAI's privacy policy. Learn how we collect, use, and protect your personal information in compliance with GDPR and CCPA.",
  },
  "/terms-of-service": {
    title: "Terms of Service | GigitekAI",
    description:
      "GigitekAI terms of service. Review the terms and conditions governing the use of our website and managed IT services.",
  },
  "/kb": {
    title: "Knowledge Base | GigitekAI Support",
    description:
      "Browse GigitekAI's knowledge base for IT support articles, troubleshooting guides, and best practices for cloud, AI, and Microsoft 365.",
  },
  "/managed-it-services-tampa": {
    title: "Managed IT Services Tampa Bay | 24/7 AI-Powered IT Support | GigitekAI",
    description:
      "Tampa Bay's #1 AI-powered managed IT provider. 24/7 helpdesk, Microsoft 365 architecture, cloud migration, Zero Trust cybersecurity. 99.9% uptime guaranteed. Free IT assessment — (727) 382-5776.",
  },
  "/managed-it-services-miami": {
    title: "Managed IT Services Miami | AI-Powered IT Support | GigitekAI",
    description:
      "Miami's trusted managed IT provider. 24/7 AI-powered helpdesk, Microsoft 365, cloud infrastructure, and cybersecurity for South Florida businesses. Free IT assessment — (727) 382-5776.",
  },
  "/hh": {
    title: "Contact Harry Henry Santiago | GigitekAI Founder",
    description:
      "Connect with Harry Henry Santiago, Microsoft 365 Architect and founder of GigitekAI. Schedule a consultation or get in touch directly.",
  },
};

/**
 * Get SEO config for a given path. Falls back to homepage config.
 */
export function getSEOForPath(path: string): PageSEO {
  // Exact match first
  if (SEO_CONFIG[path]) return SEO_CONFIG[path];

  // Try matching service detail pages by prefix
  for (const [key, value] of Object.entries(SEO_CONFIG)) {
    if (path.startsWith(key) && key !== "/") return value;
  }

  // Fallback to homepage
  return SEO_CONFIG["/"];
}
