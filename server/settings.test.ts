import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getSetting, setSetting, deleteSetting } from "./db";

describe("Settings Helper Functions", () => {
  const testKey = "test_setting_key";
  const testValue = { message: "test value", timestamp: new Date().toISOString() };

  beforeAll(async () => {
    // Clean up before tests
    await deleteSetting(testKey);
  });

  afterAll(async () => {
    // Clean up after tests
    await deleteSetting(testKey);
  });

  it("should set and get a string setting", async () => {
    const stringValue = "test string";
    const success = await setSetting(testKey, stringValue, "Test string setting");
    expect(success).toBe(true);

    const retrieved = await getSetting(testKey);
    expect(retrieved).toBe(stringValue);
  });

  it("should set and get a JSON object setting", async () => {
    const success = await setSetting(testKey, testValue, "Test JSON setting");
    expect(success).toBe(true);

    const retrieved = await getSetting(testKey);
    expect(retrieved).toEqual(testValue);
  });

  it("should return null for non-existent setting", async () => {
    const result = await getSetting("non_existent_key_12345");
    expect(result).toBeNull();
  });

  it("should update existing setting", async () => {
    const initialValue = "initial";
    await setSetting(testKey, initialValue);

    const updatedValue = "updated";
    const success = await setSetting(testKey, updatedValue);
    expect(success).toBe(true);

    const retrieved = await getSetting(testKey);
    expect(retrieved).toBe(updatedValue);
  });

  it("should delete a setting", async () => {
    await setSetting(testKey, "value to delete");
    const success = await deleteSetting(testKey);
    expect(success).toBe(true);

    const retrieved = await getSetting(testKey);
    expect(retrieved).toBeNull();
  });

  it("should handle AI News last run date setting", async () => {
    const aiNewsKey = "ai_news_last_run_date";
    const dateValue = "2026-05-24";

    await deleteSetting(aiNewsKey);

    const success = await setSetting(
      aiNewsKey,
      dateValue,
      "Last date when AI News recap was generated"
    );
    expect(success).toBe(true);

    const retrieved = await getSetting(aiNewsKey);
    expect(retrieved).toBe(dateValue);

    await deleteSetting(aiNewsKey);
  });
});
