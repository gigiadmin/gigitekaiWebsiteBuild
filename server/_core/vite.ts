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

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "../", "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `[Server] Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  } else {
    console.log(`[Server] Serving static files from: ${distPath}`);
  }

  // ── In-memory HTML cache to eliminate TTFB disk I/O ──────────────────────
  // The main index.html is read from disk on first request and cached in memory.
  // This reduces TTFB from ~2-3s (cold disk read + Cloud Run cold start) to <50ms.
  // Cache is invalidated if the file changes on disk (checked via mtime).
  let cachedHtml: string | null = null;
  let cachedHtmlMtime: number = 0;

  function getIndexHtml(): string {
    const indexPath = path.resolve(distPath, "index.html");
    try {
      const stat = fs.statSync(indexPath);
      const mtime = stat.mtimeMs;
      if (cachedHtml && mtime === cachedHtmlMtime) {
        return cachedHtml;
      }
      cachedHtml = fs.readFileSync(indexPath, "utf-8");
      cachedHtmlMtime = mtime;
      console.log(`[Server] HTML cache refreshed (${Math.round(cachedHtml.length / 1024)}KB)`);
      return cachedHtml;
    } catch {
      return "";
    }
  }

  // Pre-warm the cache at startup
  try { getIndexHtml(); } catch { /* ignore */ }

  app.use(express.static(distPath, {
    // Static assets (JS/CSS/images) get 1-year immutable cache
    setHeaders(res, filePath) {
      if (/\.(js|css|woff2|webp|png|jpg|jpeg|gif|svg|ico)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

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
    // Serve from in-memory cache for fast TTFB
    const html = getIndexHtml();
    if (html) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
  
  // 404 handler for API routes that weren't matched
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

}
