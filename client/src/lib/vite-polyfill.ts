// This file exists solely to ensure the Vite/Rollup modulepreload polyfill
// is bundled into the react-core chunk (which is always loaded on public pages)
// instead of the msal chunk (which should only load on /admin routes).
// DO NOT import this file directly - it's referenced via vite.config.ts manualChunks.
export {};
