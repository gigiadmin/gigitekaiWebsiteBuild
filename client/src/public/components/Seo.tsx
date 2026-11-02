import { useEffect } from "react";
import { SITE } from "../site.config";

/**
 * Client-side document head updates for SPA navigation.
 * Initial HTML head is produced at build time (scripts/prerender-public-site.mjs)
 * and adjusted per request by the server's prerender middleware, so crawlers
 * never depend on this hook.
 */
export function usePageMeta(opts: { title: string; description: string; path: string; noindex?: boolean }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = opts.title;
    setMeta('meta[name="description"]', "content", opts.description);
    setMeta('meta[property="og:title"]', "content", opts.title);
    setMeta('meta[property="og:description"]', "content", opts.description);
    const url = opts.path === "/" ? `${SITE.url}/` : `${SITE.url}${opts.path}`;
    setMeta('meta[property="og:url"]', "content", url);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (opts.noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, follow";
    } else if (robots && robots.content.includes("noindex")) {
      robots.content = "index, follow";
    }
  }, [opts.title, opts.description, opts.path, opts.noindex]);
}

function setMeta(selector: string, attr: string, value: string) {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) el.setAttribute(attr, value);
}

/** Scroll to top on route change (respects in-page anchors). */
export function useScrollTop(path: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [path]);
}
