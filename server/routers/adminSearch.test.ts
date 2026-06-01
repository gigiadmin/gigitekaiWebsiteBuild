import { describe, it, expect, beforeAll } from "vitest";

describe("Admin Search LLM Integration", () => {
  let claudeKey: string | undefined;
  let geminiKey: string | undefined;

  beforeAll(() => {
    claudeKey = process.env.CLAUDE_API_KEY;
    geminiKey = process.env.GEMINI_API_KEY;
  });

  it("should have Claude API key configured", () => {
    expect(claudeKey).toBeDefined();
    expect(claudeKey).toBeTruthy();
    expect(claudeKey?.length).toBeGreaterThan(10);
  });

  it("should have Gemini API key configured", () => {
    expect(geminiKey).toBeDefined();
    expect(geminiKey).toBeTruthy();
    expect(geminiKey?.length).toBeGreaterThan(10);
  });

  it("should validate Claude API key format", () => {
    // Claude keys typically start with 'sk-'
    expect(claudeKey).toMatch(/^sk-/);
  });

  it("should validate Gemini API key format", () => {
    // Gemini keys are typically alphanumeric
    expect(geminiKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should have Manus LLM configured", () => {
    const manusUrl = process.env.BUILT_IN_FORGE_API_URL;
    const manusKey = process.env.BUILT_IN_FORGE_API_KEY;
    expect(manusUrl).toBeDefined();
    expect(manusKey).toBeDefined();
  });
});
