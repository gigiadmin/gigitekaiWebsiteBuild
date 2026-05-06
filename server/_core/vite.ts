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

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // IMPORTANT: Skip /api/* routes so they reach the tRPC middleware
  app.use("*", (req, res, next) => {
    // Don't serve index.html for API routes - let them 404 or be handled by tRPC
    if (req.path.startsWith("/api/")) {
      return next();
    }
    // Prevent caching of HTML pages to ensure users always get the latest version
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    // Serve redirect.html for MSAL redirect bridge page
    if (req.path === "/redirect.html" || req.path === "/redirect") {
      const redirectPath = path.resolve(distPath, "redirect.html");
      if (fs.existsSync(redirectPath)) {
        return res.sendFile(redirectPath);
      }
    }

    // Serve index.html from in-memory cache (re-read if file changed on disk)
    const indexPath = path.resolve(distPath, "index.html");
    try {
      const stat = fs.statSync(indexPath);
      const mtime = stat.mtimeMs;
      if (!cachedHtml || cachedHtmlMtime !== mtime) {
        const raw = fs.readFileSync(indexPath, "utf-8");
        cachedHtml = transformHtmlForProduction(raw);
        cachedHtmlMtime = mtime;
        console.log("[Server] index.html cache refreshed");
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(cachedHtml);
    } catch {
      // Fallback to sendFile if cache fails
      res.sendFile(indexPath);
    }
  });
  
  // 404 handler for API routes that weren't matched
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

}
