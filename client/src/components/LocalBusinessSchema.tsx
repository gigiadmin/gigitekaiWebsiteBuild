import { useEffect } from "react";

/**
 * LocalBusinessSchema — Injects LocalBusiness + Organization JSON-LD
 * structured data for Google Local Pack eligibility.
 * Place this on the homepage only.
 */
export function LocalBusinessSchema() {
  useEffect(() => {
    const schemaId = "local-business-schema";
    document.getElementById(schemaId)?.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = schemaId;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://gigitekai.com/#localbusiness",
      name: "GigitekAI",
      alternateName: "GigitekAI LLC",
      description:
        "AI-first Managed Service Provider (MSP) specializing in Microsoft 365, cloud infrastructure, cybersecurity, and AI automation for businesses in Tampa Bay and South Florida.",
      additionalType: "LocalBusiness",
      serviceType: "Managed Service Provider",
      url: "https://gigitekai.com",
      telephone: "+1-727-382-5776",
      email: "support@gigitek.com",
      image:
        "https://gigitekai.com",
      logo: {
        "@type": "ImageObject",
        url: "https://gigitekai.com",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "4023 N Armenia Ave",
        addressLocality: "Tampa",
        addressRegion: "FL",
        postalCode: "33607",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 27.9706,
        longitude: -82.4892,
      },
      priceRange: "$$",
      areaServed: [
        {
          "@type": "City",
          name: "Tampa",
          containedInPlace: { "@type": "State", name: "Florida" },
        },
        {
          "@type": "City",
          name: "St. Petersburg",
          containedInPlace: { "@type": "State", name: "Florida" },
        },
        {
          "@type": "City",
          name: "Miami",
          containedInPlace: { "@type": "State", name: "Florida" },
        },
        {
          "@type": "City",
          name: "Orlando",
          containedInPlace: { "@type": "State", name: "Florida" },
        },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
          opens: "08:00",
          closes: "18:00",
        },
      ],
      sameAs: [
        "https://www.linkedin.com/company/gigitekai",
        "https://twitter.com/gigitekai",
        "https://www.facebook.com/gigitekai",
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Managed IT Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Managed IT Services",
              description:
                "24/7 proactive IT monitoring, helpdesk support, and infrastructure management.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Microsoft 365 Architecture",
              description:
                "Expert M365 migration, Teams deployment, Exchange Online, and license optimization.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "AI Automation",
              description:
                "AI-powered helpdesk, workflow automation, and intelligent agent deployment.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Cybersecurity",
              description:
                "Zero Trust architecture, NIST compliance, 24/7 threat monitoring and incident response.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Cloud Infrastructure",
              description:
                "Azure, AWS, and hybrid cloud migration with 99.99% availability.",
            },
          },
        ],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "47",
        bestRating: "5",
      },
    });
    document.head.appendChild(script);

    return () => {
      document.getElementById(schemaId)?.remove();
    };
  }, []);

  return null;
}

export default LocalBusinessSchema;
