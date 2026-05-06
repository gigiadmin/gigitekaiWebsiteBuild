/**
 * vite-plugin-inline-polyfill.ts
 *
 * Problem: Rollup places the __modulepreload polyfill in the msal chunk because
 * msal is the first chunk alphabetically that uses dynamic imports. This forces
 * the browser to download the entire 277KB msal bundle on every page load just
 * to get a ~500 byte polyfill function.
 *
 * Solution: Post-process the built main.js to replace the static import of the
 * polyfill from msal with an inline version of the polyfill. This eliminates the
 * forced msal download on public pages.
 */
import type { Plugin } from "vite";

export function inlineModulePreloadPolyfill(): Plugin {
  let msalChunkName: string | null = null;

  return {
    name: "inline-modulepreload-polyfill",
    apply: "build",
    enforce: "post",

    generateBundle(_, bundle) {
      // Find the msal chunk name
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === "chunk" && fileName.includes("msal-") && !fileName.includes("msalConfig")) {
          msalChunkName = fileName;
          break;
        }
      }

      if (!msalChunkName) return;

      // Find the main entry chunk
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;
        if (!chunk.isEntry) continue;
        if (!fileName.includes("main-")) continue;

        const code = chunk.code;
        // Look for the static import of _ from msal chunk
        const msalBaseName = msalChunkName.replace(/^assets\//, "");
        const importPattern = new RegExp(
          `import\\{([^}]+)\\}from"\\./${msalBaseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}";`
        );
        const match = code.match(importPattern);

        if (!match) continue;

        // The polyfill function - inline version of Rollup's __modulepreload helper
        // This is the exact same code that Rollup generates, inlined to avoid the
        // forced 277KB msal download on public pages
        const inlinePolyfill = `
const __msp_relList=typeof document<"u"&&document.createElement("link").relList;
const __msp_supportsPreload=__msp_relList&&__msp_relList.supports&&__msp_relList.supports("modulepreload")?"modulepreload":"preload";
const __msp_seen={};
const __msp_base=function(u){return"/"+u};
const g=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){const c=function(l){return Promise.all(l.map(h=>Promise.resolve(h).then(d=>({status:"fulfilled",value:d}),d=>({status:"rejected",reason:d}))))};document.getElementsByTagName("link");const s=document.querySelector("meta[property=csp-nonce]"),a=s?.nonce||s?.getAttribute("nonce");r=c(t.map(l=>{if(l=__msp_base(l),l in __msp_seen)return;__msp_seen[l]=!0;const h=document.createElement("link");h.rel=__msp_supportsPreload;if(__msp_supportsPreload==="preload"){h.as="script";h.crossOrigin=""}h.href=l;if(a)h.setAttribute("nonce",a);document.head.appendChild(h);return h}))}return r.then(()=>e()).catch(l=>{const h=new Event("vite:preloadError",{cancelable:!0});h.payload=l;window.dispatchEvent(h);if(!h.defaultPrevented)throw l})};
`.trim();

        // Replace the static import with the inline polyfill
        const importedNames = match[1]; // e.g., "_ as g"
        const newCode = code.replace(
          match[0],
          `/* modulepreload polyfill inlined to avoid loading 277KB msal chunk on public pages */\n${inlinePolyfill}\n`
        );

        if (newCode !== code) {
          (chunk as any).code = newCode;
          console.log(`[inline-polyfill] Replaced msal polyfill import in ${fileName} (saved 277KB on public pages)`);
        }
      }
    },
  };
}
