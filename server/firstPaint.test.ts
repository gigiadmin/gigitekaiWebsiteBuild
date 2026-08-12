import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

describe("public first-paint behavior", () => {
  it("does not ship a stale static hero behind the active React app", () => {
    const html = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");
    expect(html).not.toContain('id="static-hero"');
  });

  it("mounts the application immediately instead of waiting for browser idle time", () => {
    const main = readFileSync(resolve(projectRoot, "client/src/main.tsx"), "utf8");
    expect(main).toContain("mountApp();");
    expect(main).not.toContain("requestIdleCallback(mountApp");
  });

  it("eager-loads the public homepage while preserving lazy loading for secondary routes", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    expect(app).toContain('import Home from "./pages/Home";');
    expect(app).not.toContain('const Home = lazy(() => import("./pages/Home"))');
  });
});
