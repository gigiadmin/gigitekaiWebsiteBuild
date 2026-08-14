import { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // Vite and the local config are only required in development mode.
  // Dynamic import keeps the production bundle from needing dev-only plugins.
  const { createServer: createViteServer } = await import("vite");
  const { default: viteConfig } = await import("../../vite.config");

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

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
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
