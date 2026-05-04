/**
 * Breadcrumb Schema Component
 * Adds structured data for breadcrumb navigation to improve SERP display
 */

export default function BreadcrumbSchema() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://gigitekai.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Services",
        "item": "https://gigitekai.com/services"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "AI Solutions",
        "item": "https://gigitekai.com/services/ai"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}
