/**
 * Vite config for the PUBLIC marketing site only (client/site.html).
 *
 * Built as a separate bundle so public pages never share a chunk graph with the
 * admin application (client/index.html → client/src/main.tsx). Output goes into
 * the same dist/public directory the server already serves, under its own
 * assets folder (site-assets/). Run AFTER the main build, which empties dist.
 *
 *   vite build -c vite.public.config.ts
 *   vite build -c vite.public.config.ts --ssr client/src/public/entry-server.tsx --outDir dist/public-ssr
 */
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(import.meta.dirname, "client");

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  root,
  publicDir: false, // static files are copied by the main build
  envDir: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      // Client build: pin React to the project copy (same approach as vite.config.ts).
      // SSR build: leave React external so wouter and the entry share one copy.
      ...(isSsrBuild
        ? {}
        : {
            react: path.resolve(import.meta.dirname, "node_modules", "react"),
            "react-dom": path.resolve(import.meta.dirname, "node_modules", "react-dom"),
          }),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: isSsrBuild ? path.resolve(import.meta.dirname, "dist/public-ssr") : path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: isSsrBuild,
    assetsDir: "site-assets",
    sourcemap: false,
    modulePreload: { polyfill: false },
    rollupOptions: isSsrBuild
      ? undefined
      : {
          input: { site: path.resolve(root, "site.html") },
          output: {
            entryFileNames: "site-assets/[name]-[hash].js",
            chunkFileNames: "site-assets/[name]-[hash].js",
            assetFileNames: "site-assets/[name]-[hash][extname]",
          },
        },
  },
}));
