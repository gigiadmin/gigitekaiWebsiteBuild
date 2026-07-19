import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // ── Serve static legal pages in development mode ──────────────────────────
  // These are pre-rendered HTML files for optimal SEO
  app.get("/privacy-policy", async (req, res, next) => {
    try {
      const legalTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "public",
        "privacy-policy.html"
      );
      if (fs.existsSync(legalTemplate)) {
        let template = await fs.promises.readFile(legalTemplate, "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
        return;
      }
    } catch (e) {
      console.error("[Privacy Policy] Error:", e);
    }
    next();
  });

  app.get("/terms-of-service", async (req, res, next) => {
    try {
      const legalTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "public",
        "terms-of-service.html"
      );
      if (fs.existsSync(legalTemplate)) {
        let template = await fs.promises.readFile(legalTemplate, "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
        return;
      }
    } catch (e) {
      console.error("[Terms of Service] Error:", e);
    }
    next();
  });

  // Homepage served by SPA catch-all below

  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Serve redirect.html for MSAL redirect bridge page (popup auth callback)
      if (url === "/redirect.html" || url === "/redirect") {
        const redirectTemplate = path.resolve(
          import.meta.dirname,
          "../..",
          "client",
          "redirect.html"
        );
        let template = await fs.promises.readFile(redirectTemplate, "utf-8");
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
        return;
      }

      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// ─── In-memory HTML cache for production ──────────────────────────────────
// Caches the transformed index.html (with non-blocking CSS injection) so
// every page request doesn't re-read disk. Cache is busted on server restart.
let cachedHtml: string | null = null;
let cachedHtmlMtime: number = 0;

/**
 * Transform the built index.html for production:
 * 1. Make the main CSS non-blocking (media=print trick) to eliminate render-blocking
 * 2. Add noscript fallback for CSS
 */
function transformHtmlForProduction(html: string): string {
  // Make the Vite-injected CSS link non-blocking
  // Pattern: <link rel="stylesheet" crossorigin href="/assets/main-HASH.css">
  // Match both: <link rel="stylesheet" crossorigin href="..."> and <link rel="stylesheet" href="...">
  return html.replace(
    /<link rel="stylesheet"(?: crossorigin)? href="(\/assets\/[^"]+\.css)">/g,
    (_, href) =>
      `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'" /><noscript><link rel="stylesheet" href="${href}" /></noscript>`
  );
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "../", "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `[Server] Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  } else {
    console.log(`[Server] Serving static files from: ${distPath}`);
  }

  // Serve static assets but NOT index.html — the catch-all below applies the
  // non-blocking CSS transform before sending index.html.
  app.use(express.static(distPath, { index: false, etag: true, maxAge: '1y', immutable: true }));

  // ── Serve static legal pages in production (pre-rendered HTML for SEO) ──────
  // These bypass the SPA catch-all so raw HTTP fetches return full HTML content.
  app.get("/privacy-policy", (_req, res) => {
    const legalPath = path.resolve(distPath, "privacy-policy.html");
    if (fs.existsSync(legalPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(legalPath);
    }
    res.redirect("/");
  });

  app.get("/terms-of-service", (_req, res) => {
    const legalPath = path.resolve(distPath, "terms-of-service.html");
    if (fs.existsSync(legalPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(legalPath);
    }
    res.redirect("/");
  });

  // Serve redirect.html for MSAL redirect bridge page
  app.get("/redirect.html", (_req, res) => {
    const redirectPath = path.resolve(distPath, "redirect.html");
    if (fs.existsSync(redirectPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.sendFile(redirectPath);
    }
    res.status(404).send("Not Found");
  });
  app.get("/redirect", (_req, res) => {
    res.redirect("/redirect.html");
  });

  // 404 handler for API routes that weren't matched
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // NOTE: No catch-all app.use("*") here.
  // prerenderMiddleware (registered before serveStatic) handles ALL HTML serving
  // for known routes and returns 404 for unknown routes. This ensures no fallback
  // 200 response exists that could be cached by the CDN for unknown routes.

}
