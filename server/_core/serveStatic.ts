import express, { type Express } from "express";
import fs from "fs";
import path from "path";

// ─── In-memory HTML cache for production ────────────────────────────────────
let cachedHtml: string | null = null;
let cachedHtmlMtime: number = 0;

function transformHtmlForProduction(html: string): string {
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

  app.use(express.static(distPath, { index: false, etag: true, maxAge: '1y', immutable: true }));

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
  // prerenderMiddleware (registered before serveStatic) handles ALL HTML serving.
}
