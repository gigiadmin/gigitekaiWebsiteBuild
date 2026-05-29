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
  const ADMIN_ONLY_CHUNKS = ['msal-', 'syntax-highlight-', 'charts-', 'tiptap-editor-'];

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
      // Note: Don't check NODE_ENV here - Vite build always produces production output
      // but the shell environment may still say 'development'
      const outDir = options.dir || 'dist/public';
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
          fs.writeFileSync(filePath, chunkInfo.code);
          stripped++;
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
      if (process.env.NODE_ENV !== 'production') {
        // In dev mode, inject preload with the source paths
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
        // Fallback to old proxy paths
        desktopPath = '/manus-storage/hero-bg-desktop_cbb9d5e6.webp';
        mobilePath = '/manus-storage/hero-bg-mobile_e0adb787.webp';
      }

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
      if (process.env.NODE_ENV !== 'production') return html;

      // Find the main chunk from the script tag in HTML
      const mainMatch = html.match(/<script[^>]*src="\/assets\/main-([a-zA-Z0-9_-]+)\.js"/);
      const mainHash = mainMatch ? mainMatch[1] : null;

      // Find react-core and vendor from the bundle output (since modulePreload is disabled,
      // these chunks aren't referenced in HTML but ARE in the critical path via static imports)
      let reactCoreFile = '';
      let criticalUtilsFile = '';
      let trpcQueryFile = '';
      const bundle = ctx.bundle;
      if (bundle) {
        for (const [fileName] of Object.entries(bundle)) {
          if (fileName.match(/react-core-[a-zA-Z0-9_-]+\.js$/)) {
            reactCoreFile = '/' + fileName;
          } else if (fileName.match(/critical-utils-[a-zA-Z0-9_-]+\.js$/)) {
            criticalUtilsFile = '/' + fileName;
          } else if (fileName.match(/trpc-query-[a-zA-Z0-9_-]+\.js$/)) {
            trpcQueryFile = '/' + fileName;
          }
        }
      }

      if (!mainHash) {
        console.warn('[critical-preload] Could not find main chunk hash');
        return html;
      }

      // Build modulepreload hints for critical chunks that are statically imported by main.
      // These tell the browser to start fetching these modules in parallel with main.js
      // instead of waiting for main.js to parse and discover the imports sequentially.
      // We intentionally do NOT preload vendor (280KB) or radix-ui (87KB) because
      // they are side-effect-only imports that can load after main renders.
      const preloadHints = [
        `<link rel="modulepreload" href="/assets/main-${mainHash}.js">`,
        reactCoreFile ? `<link rel="modulepreload" href="${reactCoreFile}">` : '',
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
      // The alias ensures every import of 'react' resolves to the same physical file.
      "react": path.resolve(import.meta.dirname, "node_modules", "react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules", "react-dom"),
      "react-dom/client": path.resolve(import.meta.dirname, "node_modules", "react-dom", "client.js"),
    },
    // Deduplicate React to prevent multiple instances when MSAL chunk or manus-runtime loads separately.
    // Without this, @azure/msal-react or @trpc/react-query uses a different React copy than the app,
    // causing 'Cannot read properties of null (reading useState/useEffect)' crash.
    dedupe: ["react", "react-dom", "react-dom/client", "@trpc/react-query", "@tanstack/react-query"],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  optimizeDeps: {
    // Let Vite 7 handle dependency discovery and pre-bundling automatically.
    // DO NOT add force:true or explicit include lists — Vite 7 uses per-file content hashes
    // for ?v= cache busting, and explicit includes can cause hash inconsistencies where
    // the same shared chunk (e.g., chunk-MO2SMAW5.js containing React) gets different
    // ?v= hashes when referenced from different pre-bundled files, causing the browser
    // to load it as two separate ES modules → two React instances → useState crash.
  },
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
          // Critical-path utilities — tiny libs needed by main chunk on every page load.
          // Splitting these from the 334KB vendor chunk means main only downloads ~15KB
          // instead of the entire vendor bundle on first paint.
          if (
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/react-helmet-async") ||
            id.includes("node_modules/superjson")
          ) {
            return "critical-utils";
          }
          // tRPC + React Query — needed on first paint for auth
          if (id.includes("@trpc") || id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) {
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
          // TipTap rich text editor + ProseMirror — only needed in admin blog/newsletter pages
          // Static import in AdminBlog.tsx was pulling ~400KB into vendor chunk
          if (
            id.includes("node_modules/@tiptap") ||
            id.includes("node_modules/prosemirror")
          ) {
            return "tiptap-editor";
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
      host: "3000-ie0hnrz4rdwwc1gm5ns3l-f6eb3fab.us2.manus.computer",
      port: 443,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
