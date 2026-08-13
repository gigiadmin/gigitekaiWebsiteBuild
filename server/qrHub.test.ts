import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const hub = readFileSync(resolve(projectRoot, "client/src/pages/QrHub.tsx"), "utf8");
const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");

describe("GigitekAI QR hub", () => {
  it("provides six validated prospect destinations with tap, copy, and share actions", () => {
    expect(hub).toContain("https://gigitekai.com/web-discovery-intake");
    expect(hub).toContain("https://gigitekai.com/free-audit");
    expect(hub).toContain("https://gigitekai.com/services/ai");
    expect(hub).toContain("https://www.linkedin.com/in/gigitekinc");
    expect(hub).toContain("06_linkedin_gigitekai_be6f179e.png");
    expect(hub).toContain("navigator.clipboard.writeText");
    expect(hub).toContain("navigator.share");
    expect(hub).toContain("Tap code to open");
  });

  it("registers the QR hub as a public route", () => {
    expect(app).toContain('<Route path={"/qr"} component={QrHub} />');
  });
});
