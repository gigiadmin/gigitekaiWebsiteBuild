/**
 * Build-time render entry for the public site (used only by
 * scripts/prerender-public-site.mjs). Not part of the runtime server.
 */
import { renderToString } from "react-dom/server";
import App from "./App";
export { PAGE_SEO, PUBLIC_SITE_ROUTES, SITE, CONTACT, SERVICES } from "./site.config";

export function render(path: string): string {
  return renderToString(<App ssrPath={path} />);
}
