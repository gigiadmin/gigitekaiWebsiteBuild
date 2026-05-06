import { useEffect } from "react";

/**
 * SEO configuration for a page.
 * Sets document title, meta description, canonical URL, Open Graph tags,
 * and optional WebPage structured data schema.
 */
interface SEOConfig {
  title: string;
  description: string;
  /** Path portion of the URL, e.g. "/about-us". Defaults to current pathname. */
  path?: string;
  /** Optional Open Graph image URL */
  ogImage?: string;
  /** Optional WebPage schema type override. Defaults to "WebPage". */
  schemaType?: "WebPage" | "AboutPage" | "ContactPage" | "FAQPage" | "ItemPage";
  /** Inject WebPage structured data. Defaults to true. */
  injectSchema?: boolean;
}

const BASE_URL = "https://gigitekai.com";
const DEFAULT_OG_IMAGE =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663509163804/KiSfSgDgUjhCCPEP.png";

const ORG_SCHEMA = {
  "@type": "Organization",
  "@id": "https://gigitekai.com/#organization",
  name: "GigitekAI",
  url: "https://gigitekai.com",
  logo: DEFAULT_OG_IMAGE,
  telephone: "+17273825776",
  email: "support@gigitekai.com",
};

/**
 * useSEO — Sets per-page <title>, <meta description>, <link rel="canonical">,
 * Open Graph tags, and WebPage structured data schema.
 *
 * Usage:
 *   useSEO({
 *     title: "About GigitekAI | Cloud & AI Technology Partner",
 *     description: "Learn about GigitekAI...",
 *     path: "/about-us",
 *     schemaType: "AboutPage",
 *   });
 */
export function useSEO({
  title,
  description,
  path,
  ogImage,
  schemaType = "WebPage",
  injectSchema = true,
}: SEOConfig) {
  useEffect(() => {
    // Determine canonical URL
    const pagePath = path ?? window.location.pathname;
    const canonicalUrl =
      pagePath === "/" ? BASE_URL : `${BASE_URL}${pagePath}`;

    // 1. Document title
    document.title = title;

    // 2. Meta description
    setMeta("description", description);

    // 3. Canonical link
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // 4. Open Graph tags
    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonicalUrl);
    setMetaProperty("og:image", ogImage ?? DEFAULT_OG_IMAGE);

    // 5. Twitter tags
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage ?? DEFAULT_OG_IMAGE);

    // 6. WebPage structured data schema
    if (injectSchema) {
      const schemaId = "webpage-schema-useseo";
      document.getElementById(schemaId)?.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = schemaId;
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": schemaType,
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: title,
        description: description,
        isPartOf: {
          "@type": "WebSite",
        "@id": "https://gigitekai.com/#website",
        url: "https://gigitekai.com",
          name: "GigitekAI",
        },
        publisher: ORG_SCHEMA,
        inLanguage: "en-US",
      });
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById("webpage-schema-useseo")?.remove();
    };
  }, [title, description, path, ogImage, schemaType, injectSchema]);
}

/** Helper: set or create a <meta name="..."> tag */
function setMeta(name: string, content: string) {
  let el = document.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Helper: set or create a <meta property="..."> tag (Open Graph) */
function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(
    `meta[property="${property}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default useSEO;
