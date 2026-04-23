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
  // Robust path resolution: try multiple possible locations
  const candidates = [
    path.resolve(import.meta.dirname, "../", "dist", "public"),  // from server/_core -> dist/public
    path.resolve(import.meta.dirname, "public"),                  // from dist/ -> dist/public
    path.resolve(process.cwd(), "dist", "public"),                // from project root
  ];

  let distPath = candidates[0];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, "index.html"))) {
      distPath = candidate;
      break;
    }
  }

  if (!fs.existsSync(distPath)) {
    console.error(
      `[Server] Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    console.error(`[Server] Tried paths: ${candidates.join(", ")}`);
  } else {
    console.log(`[Server] Serving static files from: ${distPath}`);
    const assetsDir = path.join(distPath, "assets");
    if (fs.existsSync(assetsDir)) {
      const assetCount = fs.readdirSync(assetsDir).length;
      console.log(`[Server] Found ${assetCount} files in assets directory`);
    }
  }

  // Service worker and manifest: NEVER cache — must always be fresh
  app.get("/sw.js", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    res.sendFile(path.resolve(distPath, "sw.js"));
  });

  app.get("/manifest.json", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.sendFile(path.resolve(distPath, "manifest.json"));
  });

  // Serve hashed assets with long-term immutable caching
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
    fallthrough: false, // Return 404 for missing assets instead of falling through to SPA
  }));

  // Serve other static files (favicon, robots.txt, etc.)
  app.use(express.static(distPath, {
    index: false, // Don't auto-serve index.html for directory requests
  }));

  // SPA fallback: only for non-asset routes (HTML pages)
  app.use("*", (_req, res) => {
    // Prevent caching of index.html to ensure users always get the latest version
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
