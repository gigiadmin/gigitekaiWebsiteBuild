/**
 * SEO Helper Library
 * Provides utilities for setting canonical tags and meta information
 */

/**
 * Generate canonical URL for a page
 * Used by page components to set proper canonical tags
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://gigitekai.com';
  return `${baseUrl}${path}`;
}

/**
 * Set page meta tags (title, description, canonical)
 * Call this in useEffect on page components
 */
export function setPageMeta(options: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}) {
  // Set title
  document.title = options.title;
  
  // Set description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', options.description);
  
  // Set canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', getCanonicalUrl(options.path));
  
  // Set OG tags
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', options.title);
  
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute('content', options.description);
  
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', getCanonicalUrl(options.path));
  
  if (options.ogImage) {
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', options.ogImage);
  }
}
