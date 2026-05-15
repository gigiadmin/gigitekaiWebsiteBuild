import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { visualizer } from "rollup-plugin-visualizer";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

/**
 * PERFORMANCE: Vite plugin that:
 * 1. Converts render-blocking CSS links to non-blocking preload pattern
 * 2. Removes modulepreload tags for admin-only chunks (msal, syntax-highlight, charts)
 *    so the browser doesn't eagerly download them on public pages
 */
function vitePluginNonBlockingCSS(): Plugin {
  // Chunks that should NOT be preloaded on public pages (admin-only)
  const ADMIN_ONLY_CHUNKS = ['msal-', 'syntax-highlight-', 'charts-'];

  return {
    name: 'vite-plugin-non-blocking-css',
    enforce: 'post',
    transformIndexHtml(html) {
      if (process.env.NODE_ENV !== 'production') return html;

      // Step 1: Remove modulepreload tags for admin-only chunks
      // These chunks are only needed on /admin routes, not public pages
      let result = html.replace(
        /<link rel="modulepreload"[^>]*href="\/assets\/(msal-|syntax-highlight-|charts-)[^"]+"[^>]*>\n?/g,
        ''
      );

      // Step 2: Transform render-blocking CSS into non-blocking preload
      // Vite injects two forms of CSS link:
      //   a) <link rel="stylesheet" crossorigin href="/assets/main-XXX.css"> (initial Vite inject)
      //   b) <link rel="stylesheet" href="/assets/main-XXX.css"> (sometimes added by other plugins)
      // We convert form (a) to a preload, and remove form (b) as a duplicate.
      
      // First pass: convert the crossorigin form to non-blocking preload
      const seenCssHrefs = new Set<string>();
      result = result.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        (_, cssHref) => {
          seenCssHrefs.add(cssHref);
          return [
            `<link rel="preload" as="style" href="${cssHref}" onload="this.onload=null;this.rel='stylesheet'">`,
            `<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`
          ].join('\n    ');
        }
      );
      
      // Second pass: remove any remaining blocking stylesheet links for /assets/ CSS
      // (these are duplicates added by other plugins after our preload was injected)
      result = result.replace(
        /<link rel="stylesheet" href="(\/assets\/[^"]+\.css)">/g,
        (match, cssHref) => {
          // Only remove if we already have a preload for this CSS file
          if (seenCssHrefs.has(cssHref)) return '';
          // If no preload exists yet, convert this one
          seenCssHrefs.add(cssHref);
          return [
            `<link rel="preload" as="style" href="${cssHref}" onload="this.onload=null;this.rel='stylesheet'">`,
            `<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`
          ].join('\n    ');
        }
      );

      return result;
    },
  };
}

/**
 * PERFORMANCE: Vite plugin that strips the static msal import from main.js and all
 * public-page lazy chunks after build. Vite places its __vite__preloadHelper function
 * in the msal chunk, causing a static main→msal dependency that forces browsers to
 * download the full 271KB MSAL library on every public page load.
 *
 * The helper is only needed for lazy-loading admin chunks, so it's safe to remove
 * the static import from public-page chunks. The msal chunk will still be loaded
 * dynamically when admin routes are accessed.
 */
function vitePluginStripMsalStaticImport(): Plugin {
  return {
    name: 'vite-plugin-strip-msal-static-import',
    enforce: 'post',
    writeBundle(options, bundle) {
      if (process.env.NODE_ENV !== 'production') return;
      const outDir = options.dir || 'dist/public';
      // Find the msal chunk name
      const msalChunkName = Object.keys(bundle).find(name => name.startsWith('assets/msal-') && name.endsWith('.js'));
      if (!msalChunkName) return;
      const msalFile = msalChunkName.split('/').pop()!; // e.g. msal-CZsMGMEI.js
      const msalBase = msalFile.replace('.js', ''); // e.g. msal-CZsMGMEI
      // Strip static msal imports from main.js and all public-page chunks
      // Admin chunks legitimately need msal, so we keep their imports
      const ADMIN_CHUNKS = ['AdminApp-', 'AdminLogin', 'AdminHome-', 'AdminUnlock-', 'redirect-'];
      let stripped = 0;
      for (const [chunkName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        if (!chunkName.endsWith('.js')) continue;
        // Skip admin chunks - they need msal
        const baseName = chunkName.split('/').pop() || '';
        if (ADMIN_CHUNKS.some(prefix => baseName.startsWith(prefix))) continue;
        const chunkInfo = chunk as { code: string };
        if (!chunkInfo.code) continue;
        // Remove side-effect import: import"./msal-XXX.js";
        const sideEffectPattern = new RegExp(`import"\.\/${msalBase}\.js";`, 'g');
        // Remove named import: import{_ as s}from"./msal-XXX.js";
        const namedPattern = new RegExp(`import\\{[^}]+\\}from"\.\/${msalBase}\.js";`, 'g');
        const original = chunkInfo.code;
        chunkInfo.code = chunkInfo.code.replace(sideEffectPattern, '').replace(namedPattern, '');
        if (chunkInfo.code !== original) {
          const filePath = path.join(outDir, chunkName);
          fs.writeFileSync(filePath, chunkInfo.code);
          stripped++;
        }
      }
      if (stripped > 0) {
        console.log(`[strip-msal] Removed static msal imports from ${stripped} public chunks (saves ~70KB gzip per page load)`);
      }
    },
  };
}

/**
 * PERFORMANCE: Vite plugin that injects preload hints for critical JS chunks.
 * This reduces the network dependency chain by telling the browser to fetch
 * critical chunks (main, react-core) earlier, improving LCP by ~1-2 seconds.
 *
 * The plugin scans the built HTML to find the actual chunk hashes and injects
 * preload links with the correct filenames.
 */
function vitePluginCriticalPreload(): Plugin {
  return {
    name: 'vite-plugin-critical-preload',
    enforce: 'post',
    transformIndexHtml(html) {
      if (process.env.NODE_ENV !== 'production') return html;

      // Find the main chunk (entry point) — it's injected as <script type="module" crossorigin src="/assets/main-HASH.js">
      const mainMatch = html.match(/<script[^>]*src="\/assets\/main-([a-zA-Z0-9_]+)\.js"/);
      const mainHash = mainMatch ? mainMatch[1] : null;

      // Find the react-core chunk
      const reactMatch = html.match(/\/assets\/react-core-([a-zA-Z0-9_]+)\.js/);
      const reactHash = reactMatch ? reactMatch[1] : null;

      if (!mainHash || !reactHash) {
        console.warn('[critical-preload] Could not find critical chunk hashes (main or react-core)');
        return html;
      }

      // Build preload hints for critical chunks
      // These chunks are in the critical path and should be fetched early
      const preloadHints = [
        `<link rel="preload" as="script" href="/assets/main-${mainHash}.js">`,
        `<link rel="preload" as="script" href="/assets/react-core-${reactHash}.js">`,
      ].join('\n    ');

      // Inject preload hints into the placeholder comment
      const result = html.replace(
        '<!-- Placeholder: vitePluginCriticalPreload will inject here -->',
        preloadHints
      );

      if (result === html) {
        console.warn('[critical-preload] Placeholder comment not found in HTML');
      }

      return result;
    },
  };
}

/**
 * PRODUCTION FIX: Vite plugin that injects a bootstrap script into the built HTML.
 * The manus-runtime script (injected by vitePluginManusRuntime) blocks ES module
 * execution in production. This bootstrap script detects when the app fails to mount
 * and forces a dynamic import to retry loading.
 */
function vitePluginBootstrapFallback(): Plugin {
  return {
    name: 'vite-plugin-bootstrap-fallback',
    enforce: 'post',
    transformIndexHtml(html) {
      // Only inject in production builds
      if (process.env.NODE_ENV !== 'production') {
        // In dev mode, still inject but with a longer delay
        return html;
      }
      // Inject bootstrap script right before </body>
      const bootstrapScript = `
    <script>
      (function() {
        var CHECK_DELAY = 1500;
        var MAX_RETRIES = 5;
        var retries = 0;
        function checkAndBootstrap() {
          if (document.getElementById('gigitekai-app')) return;
          if (retries >= MAX_RETRIES) {
            var root = document.getElementById('root');
            if (root && !root.children.length) {
              root.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0E1A;color:white;font-family:sans-serif;text-align:center;padding:2rem;"><div><h1 style="color:#00D4FF;font-size:2.5rem;margin-bottom:1rem;">GigitekAI</h1><p style="font-size:1.2rem;margin-bottom:2rem;">Loading your experience...</p><button onclick="location.reload()" style="background:#00D4FF;color:#0A0E1A;border:none;padding:12px 32px;font-size:1rem;border-radius:8px;cursor:pointer;font-weight:600;">Refresh Page</button></div></div>';
            }
            return;
          }
          retries++;
          var scripts = document.querySelectorAll('script[type="module"]');
          for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].src && scripts[i].src.indexOf('/assets/index-') !== -1) {
              import(scripts[i].src).catch(function(e) {
                console.warn('[Bootstrap] Dynamic import attempt ' + retries + ' failed:', e);
              });
              break;
            }
          }
          setTimeout(checkAndBootstrap, CHECK_DELAY);
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() { setTimeout(checkAndBootstrap, CHECK_DELAY); });
        } else {
          setTimeout(checkAndBootstrap, CHECK_DELAY);
        }
      })();
    </script>`;
      return html.replace('</body>', bootstrapScript + '\n  </body>');
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  vitePluginManusDebugCollector(),
  vitePluginNonBlockingCSS(),
  vitePluginBootstrapFallback(),
  // DISABLED: vitePluginStripMsalStaticImport() — caused 'n is not defined' crash by removing named imports that were actually used at runtime
  visualizer({
    open: false,
    gzipSize: true,
    brotliSize: true,
    filename: 'dist/public/bundle-analysis.html',
  }),
];

// Enable production mode for accurate analysis
const isAnalyze = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
   build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: isAnalyze ? 999999 : 700,
    minify: 'esbuild',
    // Disable modulePreload entirely — prevents Vite from injecting <link rel="modulepreload">
    // tags in index.html. Without this, the browser eagerly downloads ALL referenced chunks
    // (vendor 1MB, react-core 388KB, icons 79KB, etc.) before the page renders, causing
    // Lighthouse to flag 448+ KiB of "unused JavaScript" on mobile. With modulePreload
    // disabled, chunks are only fetched when their dynamic import() actually executes.
    modulePreload: false,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "client", "index.html"),
        redirect: path.resolve(import.meta.dirname, "client", "redirect.html"),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          // IMPORTANT: Chunk grouping must avoid circular dependencies.
          // Previous config caused admin-heavy <-> utils cycle causing TDZ errors.
          // Now we use a flat, non-overlapping grouping strategy.

          // React core — smallest possible initial chunk
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
            return "react-core";
          }
          // tRPC + React Query — needed on first paint for auth
          if (id.includes("@trpc") || id.includes("@tanstack/react-query")) {
            return "trpc-query";
          }
          // MSAL (Azure AD auth) — only needed on /admin routes
          // Splitting into its own chunk allows public pages to skip this ~300KB library
          if (id.includes("@azure/msal-browser") || id.includes("@azure/msal-react") || id.includes("@azure/msal-common")) {
            return "msal";
          }
          // Charts/data-viz — only needed in admin dashboards (recharts, d3, victory)
          // Splitting saves ~200KB from the public page critical path
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/d3/") ||
            id.includes("node_modules/victory") ||
            id.includes("node_modules/victory-") ||
            id.includes("node_modules/internmap") ||
            id.includes("node_modules/robust-predicates")
          ) {
            return "charts";
          }
          // Syntax highlighting — only needed in blog/AI chat code blocks
          if (
            id.includes("node_modules/highlight.js") ||
            id.includes("node_modules/lowlight") ||
            id.includes("node_modules/fault")
          ) {
            return "syntax-highlight";
          }
          // Markdown rendering — only needed in blog/KB/AI chat pages, NOT on homepage
          // Splitting saves ~400KB from vendor chunk (react-markdown + remark + rehype + unified)
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark") ||
            id.includes("node_modules/rehype") ||
            id.includes("node_modules/unified") ||
            id.includes("node_modules/vfile") ||
            id.includes("node_modules/hast") ||
            id.includes("node_modules/mdast") ||
            id.includes("node_modules/micromark") ||
            id.includes("node_modules/unist") ||
            id.includes("node_modules/marked") ||
            id.includes("node_modules/property-information") ||
            id.includes("node_modules/decode-named-character-reference") ||
            id.includes("node_modules/character-entities") ||
            id.includes("node_modules/html-url-attributes") ||
            id.includes("node_modules/zwitch") ||
            id.includes("node_modules/hastscript") ||
            id.includes("node_modules/comma-separated-tokens") ||
            id.includes("node_modules/space-separated-tokens")
          ) {
            return "markdown-renderer";
          }
          // Animation libraries — only needed on pages with motion effects
          if (
            id.includes("node_modules/framer-motion") ||
            id.includes("node_modules/motion")
          ) {
            return "animation";
          }
          // Form libraries — only needed on pages with forms
          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform") ||
            id.includes("node_modules/zod")
          ) {
            return "forms";
          }
          // Stripe — only needed on pricing/checkout pages
          if (
            id.includes("node_modules/@stripe") ||
            id.includes("node_modules/stripe")
          ) {
            return "stripe-sdk";
          }
          // Date/time utilities — only needed in admin/helpdesk
          if (
            id.includes("node_modules/date-fns") ||
            id.includes("node_modules/dayjs")
          ) {
            return "date-utils";
          }
          // Lucide icons — ~200KB of SVG icon components
          // Most icons are only used in admin pages, not on the public homepage
          if (id.includes("node_modules/lucide-react") || id.includes("node_modules/lucide/")) {
            return "icons";
          }
          // Sonner toast library — used across pages but not critical for first paint
          if (id.includes("node_modules/sonner")) {
            return "toast";
          }
          // Wouter routing library — only needed on admin/app pages, NOT on public homepage
          // Splitting saves ~30KB from homepage critical path
          if (id.includes("node_modules/wouter")) {
            return "routing";
          }
          // Radix UI primitives — needed for shadcn/ui components
          // Keep together to avoid excessive chunk count
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }
          // All other node_modules go into a single vendor chunk.
          // NOTE: streamdown/shiki/mermaid cannot be split into a separate chunk because
          // some node_module in vendor has a static import of streamdown, which would
          // create a vendor→streamdown-deps static dependency (defeating the purpose).
          // modulePreload:false still prevents eager browser preloading of vendor.
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  ...(isAnalyze && { mode: 'production' }),
  server: {
    host: true,
    ...(isAnalyze && { middlewareMode: true }),
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    hmr: {
      protocol: "wss",
      host: "3000-ioz9dg0veudz1h31q3330-0aeb3862.us2.manus.computer",
      port: 443,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
