/**
 * Schema Markup Component
 * Renders JSON-LD structured data for SEO
 * Includes: Organization, LocalBusiness, FAQPage, BreadcrumbList
 */

export function SchemaMarkup() {
  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GigitekAI",
    url: "https://gigitekai.com",
    logo: "https://gigitekai.com/gigitekai-logo.jpg",
    description: "GigitekAI is an AI-first Managed Services Provider specializing in Microsoft 365 architecture, AI workflow automation, LLM integration, cybersecurity, and helpdesk services for SMBs.",
    sameAs: [
      "https://www.linkedin.com/company/gigitekai",
      "https://twitter.com/gigitekai",
      "https://www.facebook.com/gigitekai",
      "https://www.youtube.com/@gigitekai"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      telephone: "(727) 382-6909",
      email: "support@gigitekai.com"
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Tampa",
      addressLocality: "Tampa",
      addressRegion: "FL",
      postalCode: "33601",
      addressCountry: "US"
    }
  };

  // LocalBusiness Schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "GigitekAI LLC",
    image: "https://gigitekai.com/gigitekai-logo.jpg",
    description: "AI-first Managed Services Provider for Microsoft 365, Cloud Infrastructure, and Cybersecurity",
    url: "https://gigitekai.com",
    telephone: "(727) 382-6909",
    email: "support@gigitekai.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Tampa",
      addressLocality: "Tampa",
      addressRegion: "FL",
      postalCode: "33601",
      addressCountry: "US"
    },
    priceRange: "$$",
    areaServed: [
      {
        "@type": "Country",
        name: "United States"
      },
      {
        "@type": "Country",
        name: "Canada"
      }
    ],
    sameAs: [
      "https://www.linkedin.com/company/gigitekai",
      "https://twitter.com/gigitekai"
    ]
  };

  // Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Microsoft 365 & Cloud Infrastructure Management",
    description: "Enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.",
    provider: {
      "@type": "Organization",
      name: "GigitekAI"
    },
    areaServed: [
      {
        "@type": "Country",
        name: "United States"
      },
      {
        "@type": "Country",
        name: "Canada"
      }
    ]
  };

  // FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is GigitekAI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GigitekAI is an AI-first Managed Services Provider specializing in Microsoft 365 architecture, AI workflow automation, LLM integration, cybersecurity, and helpdesk services for SMBs."
        }
      },
      {
        "@type": "Question",
        name: "What services does GigitekAI offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GigitekAI offers Cloud Infrastructure, AI & Machine Learning, Managed IT Services, Cybersecurity, and Data Analytics solutions."
        }
      },
      {
        "@type": "Question",
        name: "What is the SLA uptime guarantee?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GigitekAI guarantees 99.9% uptime SLA with 24/7 AI-powered support."
        }
      },
      {
        "@type": "Question",
        name: "How long does it take to deploy AI agents?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GigitekAI can provision clients across 8+ systems in approximately 3.4 seconds using our multi-system agentic AI orchestrator."
        }
      },
      {
        "@type": "Question",
        name: "What compliance standards does GigitekAI follow?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GigitekAI operates with compliance-ready infrastructure supporting HIPAA, SOC 2, PCI-DSS, and CMMC standards."
        }
      }
    ]
  };

  // BreadcrumbList Schema (for homepage)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://gigitekai.com"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: "https://gigitekai.com/#services"
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "About",
        item: "https://gigitekai.com/about"
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Contact",
        item: "https://gigitekai.com/#contact"
      }
    ]
  };

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      
      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      
      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
