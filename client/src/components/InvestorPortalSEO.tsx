/**
 * InvestorPortalSEO.tsx
 * 
 * SEO optimization for investor portal
 * - Schema markup for investor relations
 * - Meta tags for social sharing
 * - Semantic keywords for search engines
 * 
 * Usage: Add this to InvestorPortal.tsx in useEffect
 */

export function setupInvestorPortalSEO() {
  // Update page title and meta description
  document.title = 'GigitekAI Investor Portal | $1M Seed Round | AI-First MSP';
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 'GigitekAI investor portal: $1M seed round, agentic orchestration, compliance-ready infrastructure, 3.4s provisioning, 5:1 LTV:CAC ratio, $450K pipeline.');
  }

  // Add semantic keywords meta tag
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', 'agentic orchestration, AI-first MSP, compliance infrastructure, HIPAA SOC2, cloud provisioning, enterprise AI, Microsoft 365, seed round, investor relations, AI agents, managed services');
  }

  // Add Open Graph tags for social sharing
  setMetaTag('og:title', 'GigitekAI Investor Portal | $1M Seed Round');
  setMetaTag('og:description', 'Enterprise-grade AI orchestration platform raising $1M seed round. 3.4s provisioning, compliance-ready, 5:1 LTV:CAC ratio.');
  setMetaTag('og:type', 'website');
  setMetaTag('og:url', window.location.href);
  setMetaTag('og:image', 'https://gigitekai.com/og-image-investor.png');

  // Add Twitter Card tags
  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:title', 'GigitekAI Investor Portal | $1M Seed Round');
  setMetaTag('twitter:description', 'Enterprise AI orchestration. 3.4s provisioning. Compliance-ready. 5:1 LTV:CAC.');
  setMetaTag('twitter:image', 'https://gigitekai.com/og-image-investor.png');

  // Add canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', `${window.location.origin}/investor-portal`);
  } else {
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = `${window.location.origin}/investor-portal`;
    document.head.appendChild(link);
  }

  // Add JSON-LD schema markup for Organization + Funding
  addSchemaMarkup({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'GigitekAI',
    'url': 'https://gigitekai.com',
    'logo': 'https://gigitekai.com/logo.png',
    'description': 'AI-first Managed Services Provider specializing in agentic orchestration, compliance infrastructure, and enterprise cloud solutions.',
    'foundingDate': '2024',
    'founders': [
      {
        '@type': 'Person',
        'name': 'Harry',
        'jobTitle': 'CEO & Founder'
      }
    ],
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Tampa Bay, FL',
      'addressRegion': 'FL',
      'postalCode': '33602',
      'addressCountry': 'US'
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Investor Relations',
      'email': 'support@gigitekai.com',
      'telephone': '+1-727-382-6909'
    },
    'sameAs': [
      'https://www.linkedin.com/company/gigitekai',
      'https://twitter.com/gigitekai'
    ]
  });

  // Add JSON-LD schema for Funding Round
  addSchemaMarkup({
    '@context': 'https://schema.org',
    '@type': 'Thing',
    'name': 'GigitekAI $1M Seed Round',
    'description': 'Seed funding round for AI-first MSP specializing in agentic orchestration and compliance infrastructure.',
    'url': 'https://gigitekai.com/investor-portal',
    'fundingAmount': {
      '@type': 'PriceSpecification',
      'priceCurrency': 'USD',
      'price': '1000000'
    },
    'fundingType': 'Seed',
    'fundingDate': '2026-05-30'
  });

  // Add JSON-LD schema for SoftwareApplication (AI Orchestrator)
  addSchemaMarkup({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'GigitekAI Agentic Orchestrator',
    'description': 'Proprietary AI orchestration platform for enterprise cloud provisioning and compliance automation.',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Cloud',
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'USD',
      'price': 'Contact for pricing'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '5',
      'ratingCount': '3',
      'bestRating': '5',
      'worstRating': '1'
    }
  });
}

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function addSchemaMarkup(schema: Record<string, any>) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

export default setupInvestorPortalSEO;
