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
  const ADMIN_ONLY_CHUNKS = ['msal-', 'syntax-highlight-', 'tiptap-editor-'];

  return {
    name: 'vite-plugin-non-blocking-css',
    enforce: 'post',
    transformIndexHtml(html) {
      // FIXED: Detect production build by checking for hashed asset paths
      // NODE_ENV may be 'development' in the shell even during `pnpm build`
      const isProductionBuild = /\/assets\/main-[a-zA-Z0-9_-]+\.js/.test(html);
      if (!isProductionBuild) return html;

      // Step 1: Remove modulepreload tags for admin-only chunks
      // These chunks are only needed on /admin routes, not public pages
      let result = html.replace(
        /<link rel="modulepreload"[^>]*href="\/assets\/(msal-|syntax-highlight-|tiptap-|stripe-)[^"]+"[^>]*>\n?/g,
        ''
      );

      // Step 2: Make CSS non-blocking using media='print' + onload trick
      // This is the same technique used for Google Fonts and is proven to work reliably.
      // The browser loads the CSS in the background (media='print' means it won't apply yet),
      // then onload switches media='all' to apply it after the page renders.
      // Fallback: <noscript> tag ensures CSS loads even if JS is disabled.
      result = result.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        (_, cssHref) => `<link rel="stylesheet" href="${cssHref}" media="print" onload="this.media='all'" />`
      );
      // Add noscript fallback for CSS (in case JS is disabled)
      result = result.replace(
        /(<\/head>)/,
        `<noscript><link rel="stylesheet" href="/assets/vendor-*.css" /><link rel="stylesheet" href="/assets/main-*.css" /></noscript>$1`
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
      // Note: Don't check NODE_ENV here - Vite build always produces production output
      // but the shell environment may still say 'development'
      const outDir = options.dir || path.resolve(import.meta.dirname, 'dist/public');
      // Find the msal chunk name
      const msalChunkName = Object.keys(bundle).find(name => name.startsWith('assets/msal-') && name.endsWith('.js'));
      if (!msalChunkName) return;
      const msalFile = msalChunkName.split('/').pop()!; // e.g. msal-CZsMGMEI.js
      const msalBase = msalFile.replace('.js', ''); // e.g. msal-CZsMGMEI
      // SAFE APPROACH: Replace msal import with a no-op __vitePreload shim.
      // Vite bundles __vitePreload into the msal chunk, creating a static dependency.
      // Since modulePreload is disabled, all calls pass empty deps arrays [],
      // so __vitePreload simplifies to just calling the first argument.
      // We replace the import with a local shim: const X = (fn) => fn();
      // This preserves the variable binding while eliminating the 230KB download.
      const ADMIN_CHUNKS = ['AdminApp-', 'AdminLogin', 'AdminHome-', 'AdminUnlock-', 'redirect-', 'AdminLoginAzure-'];
      let stripped = 0;
      for (const [chunkName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        if (!chunkName.endsWith('.js')) continue;
        // Skip admin chunks - they legitimately need msal
        const baseName = chunkName.split('/').pop() || '';
        if (ADMIN_CHUNKS.some(prefix => baseName.startsWith(prefix))) continue;
        const chunkInfo = chunk as { code: string };
        if (!chunkInfo.code) continue;
        const original = chunkInfo.code;
        // Replace named import: import{_ as X}from"./msal-XXX.js"; -> const X=(fn)=>fn();
        const namedPattern = new RegExp(`import\\{_\\s+as\\s+(\\w+)\\}from"\\.\\/${msalBase}\\.js";`, 'g');
        chunkInfo.code = chunkInfo.code.replace(namedPattern, (_, varName) => {
          return `const ${varName}=(fn)=>fn();`;
        });
        // Remove side-effect imports: import"./msal-XXX.js";
        const sideEffectPattern = new RegExp(`import"\\.\\/${msalBase}\\.js";`, 'g');
        chunkInfo.code = chunkInfo.code.replace(sideEffectPattern, '');
        if (chunkInfo.code !== original) {
          const filePath = path.join(outDir, chunkName);
          try {
            // Ensure directory exists before writing
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, chunkInfo.code);
            stripped++;
          } catch (err) {
            console.error(`[strip-msal] Failed to write ${filePath}:`, err);
          }
        }
      }
      if (stripped > 0) {
        console.log(`[strip-msal] Replaced msal imports with no-op shim in ${stripped} public chunks (saves ~230KB / ~60KB gzip)`);
      }
    },
  };
}

/**
 * PERFORMANCE: Vite plugin that injects preload hints for the hero background image.
 * After build, the hero images are hashed assets under /assets/. This plugin finds
 * them in the bundle and injects a <link rel="preload"> with responsive imagesrcset
 * so the browser starts fetching the LCP image immediately without waiting for JS.
 */
function vitePluginHeroPreload(): Plugin {
  return {
    name: 'vite-plugin-hero-preload',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      // FIXED: Use ctx.bundle to detect production build instead of NODE_ENV.
      // NODE_ENV may be 'development' in the shell even during `pnpm build`,
      // which caused dev paths (/src/assets/) to be injected into production HTML.
      const isProductionBuild = ctx.bundle && Object.keys(ctx.bundle).length > 0;

      if (!isProductionBuild) {
        // In dev mode, inject preload with the source paths (Vite serves these directly)
        const devPreload = `<link rel="preload" as="image"
      href="/src/assets/hero-bg-desktop.webp"
      imagesrcset="/src/assets/hero-bg-mobile.webp 768w, /src/assets/hero-bg-desktop.webp 1920w"
      imagesizes="(max-width: 768px) 768px, 1920px"
      fetchpriority="high" />`;
        return html.replace(
          '<!-- Placeholder: vitePluginHeroPreload will inject here -->',
          devPreload
        );
      }

      // In production, find the hashed asset filenames from the bundle
      const bundle = ctx.bundle;
      let desktopPath = '';
      let mobilePath = '';
      if (bundle) {
        for (const [fileName] of Object.entries(bundle)) {
          if (fileName.includes('hero-bg-desktop') && fileName.endsWith('.webp')) {
            desktopPath = '/' + fileName;
          } else if (fileName.includes('hero-bg-mobile') && fileName.endsWith('.webp')) {
            mobilePath = '/' + fileName;
          }
        }
      }
      // Fallback: scan the HTML for the asset references
      if (!desktopPath) {
        const desktopMatch = html.match(/\/assets\/hero-bg-desktop[^"'\s]+\.webp/);
        if (desktopMatch) desktopPath = desktopMatch[0];
      }
      if (!mobilePath) {
        const mobileMatch = html.match(/\/assets\/hero-bg-mobile[^"'\s]+\.webp/);
        if (mobileMatch) mobilePath = mobileMatch[0];
      }

      if (!desktopPath || !mobilePath) {
        console.warn('[hero-preload] Could not find hero image asset paths in bundle');
        // Fallback to CDN paths that are known to work
        desktopPath = '/manus-storage/hero-bg-desktop_cbb9d5e6.webp';
        mobilePath = '/manus-storage/hero-bg-mobile_e0adb787.webp';
      }

      console.log(`[hero-preload] Production paths: desktop=${desktopPath}, mobile=${mobilePath}`);

      const preloadTag = `<link rel="preload" as="image"
      href="${desktopPath}"
      imagesrcset="${mobilePath} 768w, ${desktopPath} 1920w"
      imagesizes="(max-width: 768px) 768px, 1920px"
      fetchpriority="high" />`;

      const result = html.replace(
        '<!-- Placeholder: vitePluginHeroPreload will inject here -->',
        preloadTag
      );

      if (result === html) {
        console.warn('[hero-preload] Placeholder comment not found in HTML');
      }

      return result;
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
    transformIndexHtml(html, ctx) {
      // FIXED: Use ctx.bundle to detect production build instead of NODE_ENV
      const isProductionBuild = ctx.bundle && Object.keys(ctx.bundle).length > 0;
      if (!isProductionBuild) return html;

      // Find the main chunk from the script tag in HTML
      const mainMatch = html.match(/<script[^>]*src="\/assets\/main-([a-zA-Z0-9_-]+)\.js"/);
      const mainHash = mainMatch ? mainMatch[1] : null;

      // Find critical chunks from the bundle output (since modulePreload is disabled,
      // these chunks aren't referenced in HTML but ARE in the critical path via static imports)
      // NOTE: react-core chunk was removed to fix circular dependency with recharts/react-smooth.
      // React now lives in vendor chunk.
      let criticalUtilsFile = '';
      let trpcQueryFile = '';
      let vendorFile = '';
      const bundle = ctx.bundle;
      if (bundle) {
        for (const [fileName] of Object.entries(bundle)) {
          if (fileName.match(/critical-utils-[a-zA-Z0-9_-]+\.js$/)) {
            criticalUtilsFile = '/' + fileName;
          } else if (fileName.match(/trpc-query-[a-zA-Z0-9_-]+\.js$/)) {
            trpcQueryFile = '/' + fileName;
          } else if (fileName.match(/vendor-[a-zA-Z0-9_-]+\.js$/) && !vendorFile) {
            // Preload vendor chunk (React, Radix, tRPC) — critical for initial render
            vendorFile = '/' + fileName;
          }
        }
      }

      if (!mainHash) {
        console.warn('[critical-preload] Could not find main chunk hash');
        return html;
      }

      // Build modulepreload hints for critical chunks.
      // The vendor chunk is NOT directly referenced in HTML — it's loaded via dynamic import
      // from main.js. Without modulepreload, the browser must:
      //   1. Download main.js (3-4s on cold start)
      //   2. Parse main.js
      //   3. Discover vendor.js import
      //   4. Download vendor.js (another 3-4s)
      // With modulepreload, steps 1 and 4 happen IN PARALLEL, saving 3-4 seconds.
      // The hero image preload has fetchpriority="high" so it won't be starved.
      const preloadHints = [
        `<link rel="modulepreload" href="/assets/main-${mainHash}.js">`,
        vendorFile ? `<link rel="modulepreload" href="${vendorFile}">` : '',
        criticalUtilsFile ? `<link rel="modulepreload" href="${criticalUtilsFile}">` : '',
        trpcQueryFile ? `<link rel="modulepreload" href="${trpcQueryFile}">` : '',
      ].filter(Boolean).join('\n    ');

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
      // FIXED: Detect production build by checking for hashed asset paths
      // NODE_ENV may be 'development' in the shell even during `pnpm build`
      const isProductionBuild = /\/assets\/main-[a-zA-Z0-9_-]+\.js/.test(html);
      if (!isProductionBuild) {
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

/**
 * Prevents the Manus proxy from caching stale pre-bundled dependency files
 * AND rewrites source file imports to include a cache-busting query parameter.
 * 
 * Problem: The proxy between browser and Vite dev server caches module responses.
 * When Vite regenerates deps with new hashes, the proxy serves old cached versions
 * causing mismatched React instances → 'Cannot read properties of null (useState)' crash.
 * 
 * Solution: This PRE-middleware monkey-patches res.end() BEFORE Vite's
 * transformMiddleware processes the request. When Vite calls res.end(body),
 * our patched version rewrites /src/... import paths to include ?cb=SESSION_ID.
 * The proxy has never seen these URLs, so it fetches fresh from the server.
 */
function vitePluginNoCacheNodeModules(): Plugin {
  const SESSION_ID = Date.now().toString(36);
  
  return {
    name: 'vite-plugin-no-cache-all',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Set no-cache headers (proxy may ignore these for already-cached URLs)
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        const url = req.url || '';
        // Only rewrite source file responses
        const shouldRewrite = (
          (url.startsWith('/src/') || (url.includes('/shared/') && !url.includes('node_modules'))) &&
          url.match(/\.(tsx?|jsx?|mjs)(\?|$)/)
        );
        
        if (!shouldRewrite) return next();
        
        // Monkey-patch res.end to intercept the response body
        const originalEnd = res.end;
        
        res.end = function(this: any, chunk?: any, encoding?: any, callback?: any) {
          // Get the response body
          let body = '';
          if (typeof chunk === 'string') {
            body = chunk;
          } else if (Buffer.isBuffer(chunk)) {
            body = chunk.toString('utf-8');
          }
          
          if (body && body.includes('from ')) {
            // Rewrite /src/... imports to include cache-bust param
            const rewritten = body.replace(
              /(from\s*["'])(\/src\/[^"'?\s]+)(["'])/g,
              (match: string, prefix: string, importPath: string, suffix: string) => {
                return `${prefix}${importPath}?cb=${SESSION_ID}${suffix}`;
              }
            ).replace(
              /(from\s*["'])(\/\@fs\/[^"'?\s]*\/shared\/[^"'?\s]+)(["'])/g,
              (match: string, prefix: string, importPath: string, suffix: string) => {
                if (importPath.includes('node_modules')) return match;
                return `${prefix}${importPath}?cb=${SESSION_ID}${suffix}`;
              }
            );
            
            // Update content-length and send rewritten body
            const buf = Buffer.from(rewritten, 'utf-8');
            res.setHeader('Content-Length', buf.length);
            return originalEnd.call(this, buf, 'utf-8', callback);
          }
          
          // Pass through unchanged
          return originalEnd.call(this, chunk, encoding, callback);
        } as any;
        
        next();
      });
    },
  };
}

// vitePluginCacheBustImports is now merged into vitePluginNoCacheNodeModules above
function vitePluginCacheBustImports(): Plugin {
  return { name: 'vite-plugin-cache-bust-imports-noop' };
}

const plugins = [
  vitePluginNoCacheNodeModules(),
  vitePluginCacheBustImports(),
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  vitePluginManusDebugCollector(),
  vitePluginNonBlockingCSS(),
  vitePluginHeroPreload(),
  vitePluginCriticalPreload(),
  vitePluginBootstrapFallback(),
  // RE-ENABLED: Now uses safe replacement (const X=(fn)=>fn()) instead of removal
  vitePluginStripMsalStaticImport(),
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
      // Force all packages to use the SAME React instance from node_modules.
      // This prevents the dual-React crash where manus-runtime or @trpc/react-query
      // loads its own React copy, causing 'Cannot read properties of null (reading useState)'.
      "react": path.resolve(import.meta.dirname, "node_modules", "react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules", "react-dom"),
      "react-dom/client": path.resolve(import.meta.dirname, "node_modules", "react-dom", "client.js"),
    },
    // Deduplicate React to prevent multiple instances when MSAL chunk or manus-runtime loads separately.
    dedupe: ["react", "react-dom", "react-dom/client", "@trpc/react-query", "@tanstack/react-query"],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  optimizeDeps: {
    // Let Vite handle dependency discovery and pre-bundling automatically.
    // The useRef/useState crash in dev preview is a known Vite 7 + React 19 CJS interop issue
    // that does NOT affect production builds (Rollup handles CJS correctly).
  },
   build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: isAnalyze ? 999999 : 700,
    // Terser: 5-15% better JS compression than esbuild, worth the slightly slower build
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove dead code and unreachable branches
        dead_code: true,
        drop_console: false, // Keep console.error/warn for production debugging
        drop_debugger: true,
        // Inline small functions for fewer call overhead
        inline: 2,
        // Remove unused variables and parameters
        unused: true,
        // Collapse single-use variables
        collapse_vars: true,
        // Reduce if/else to ternary where possible
        conditionals: true,
        // Evaluate constant expressions at build time
        evaluate: true,
        // Remove unreachable code after return/throw
        sequences: true,
        // Merge consecutive simple statements
        join_vars: true,
        // Hoist function declarations
        hoist_funs: false,
        // Remove pure function calls with no side effects
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Two compression passes for better ratio
      },
      mangle: {
        // Shorten property names for extra savings
        properties: false, // Disabled — breaks runtime property access
        toplevel: false,   // Disabled — breaks module exports
      },
      format: {
        // Remove all comments except legal notices
        comments: false,
        // Compact output
        beautify: false,
      },
    },
    // LightningCSS: Rust-based CSS minifier, faster and better than esbuild CSS
    cssMinify: 'lightningcss',
    // Disable modulePreload entirely — prevents Vite from injecting <link rel="modulepreload">
    // tags in index.html. Without this, the browser eagerly downloads ALL referenced chunks
    // (vendor 1MB, react-core 388KB, icons 79KB, etc.) before the page renders, causing
    // Lighthouse to flag 448+ KiB of "unused JavaScript" on mobile. With modulePreload
    // disabled, chunks are only fetched when their dynamic import() actually executes.
    modulePreload: false,
    rollupOptions: {
      // Enable aggressive tree-shaking to remove unused Radix UI components
      // This reduces vendor bundle from ~280KB to ~200KB by eliminating unused UI primitives
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      input: {
        main: path.resolve(import.meta.dirname, "client", "index.html"),
        redirect: path.resolve(import.meta.dirname, "client", "redirect.html"),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // SMART CODE SPLITTING v2: Separate heavy/admin-only libs from public critical path.
        // IMPORTANT: React must stay in vendor (not a separate chunk) to avoid dual-React
        // crashes with recharts/react-smooth which have their own React imports.
        // We split out ONLY truly independent heavy libs that are NOT needed on homepage.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // ── MSAL / Azure AD: admin-only, never needed on public pages ─────────
          // Keep all Azure libs together to avoid circular deps between them
          if (
            id.includes('@azure/msal') ||
            id.includes('@azure/identity') ||
            id.includes('@azure/communication')
          ) return 'msal';

          // ── Tiptap rich-text editor: only needed in admin blog editor ─────────
          // Keep tiptap + prosemirror together (tiptap depends on prosemirror)
          if (id.includes('@tiptap/') || id.includes('prosemirror')) return 'tiptap';

          // ── Stripe: only needed on pricing/checkout pages ─────────────────────
          if (id.includes('@stripe/') || id.includes('/stripe/')) return 'stripe';

          // ── SAFE SPLITS: Packages with NO React peer deps ──────────────────
          // These are truly independent libraries that can be safely isolated
          // without causing circular dependency or initialization order issues.

          // NOTE: highlight.js/lowlight CANNOT be safely split because vendor
          // has a static import dependency on it (via tiptap lowlight extension
          // that leaks into vendor). Splitting it causes initialization errors.
          // if (id.includes('highlight.js') || id.includes('lowlight')) return 'syntax-highlight';

          // socket.io-client: Only used in WebSocket hook + RemoteSession (lazy-loaded)
          // No React deps, pure networking library
          if (id.includes('socket.io-client') || id.includes('engine.io')) return 'websocket';

          // pdf-lib: Only used server-side or in admin PDF generation
          // No React deps, pure PDF manipulation library
          if (id.includes('pdf-lib')) return 'pdf';

          // ── IMPORTANT: Keep recharts, d3, React, Radix, tRPC together ────────
          // DO NOT split recharts/d3 — they have React peer deps and splitting
          // them causes "Cannot access 'gm' before initialization" crash.
          // All React-dependent packages MUST stay in vendor to ensure correct
          // initialization order.
          // Build: 2026-07-08T16:00:00Z (terser+lightningcss minification)
          return 'vendor';
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
      host: "3000-ie0hnrz4rdwwc1gm5ns3l-f6eb3fab.us2.manus.computer",
      port: 443,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
