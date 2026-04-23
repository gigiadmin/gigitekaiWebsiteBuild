import { useEffect } from "react";

/**
 * SEO configuration for a page.
 * Sets document title, meta description, canonical URL, and Open Graph tags.
 */
interface SEOConfig {
  title: string;
  description: string;
  /** Path portion of the URL, e.g. "/about-us". Defaults to current pathname. */
  path?: string;
  /** Optional Open Graph image URL */
  ogImage?: string;
}

const BASE_URL = "https://www.gigitekai.com";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/icon-512_a8893ff4.png";

/**
 * useSEO — Sets per-page <title>, <meta description>, <link rel="canonical">,
 * and Open Graph tags using DOM manipulation (works with react-helmet-async too).
 *
 * Usage:
 *   useSEO({
 *     title: "About GigitekAI | Cloud & AI Technology Partner",
 *     description: "Learn about GigitekAI...",
 *     path: "/about-us",
 *   });
 */
export function useSEO({ title, description, path, ogImage }: SEOConfig) {
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
  }, [title, description, path, ogImage]);
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
