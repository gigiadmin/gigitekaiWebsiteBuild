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
  vitePluginBootstrapFallback(),
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
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
          // All other node_modules go into a single vendor chunk.
          // Splitting further (radix-ui, icons, utils, admin-heavy, charts)
          // caused circular dependencies and TDZ errors in production.
          // A single vendor chunk is larger but guaranteed cycle-free.
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
      host: "3000-i6c9mlbjdygazp3vmpfet-1c87ebd7.us2.manus.computer",
      port: 443,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
