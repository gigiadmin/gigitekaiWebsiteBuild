import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ callLLM: vi.fn() }));

vi.mock("../_core/multiLLM", () => ({
  callLLM: mocks.callLLM,
}));

import { callAriaLLM } from "./ariaLLM";

const messages = [{ role: "user" as const, content: "Hello" }];

describe("callAriaLLM", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses DeepSeek first", async () => {
    mocks.callLLM.mockResolvedValue({ content: "Hello from Aria", model: "deepseek" });

    const result = await callAriaLLM(messages);

    expect(result.content).toBe("Hello from Aria");
    expect(mocks.callLLM).toHaveBeenCalledWith("deepseek", messages, { fallbackToManus: false });
    expect(mocks.callLLM).toHaveBeenCalledTimes(1);
  });

  it("falls back to Gemini when DeepSeek is unavailable", async () => {
    mocks.callLLM
      .mockRejectedValueOnce(new Error("DeepSeek unavailable"))
      .mockResolvedValueOnce({ content: "Recovered response", model: "gemini" });

    const result = await callAriaLLM(messages);

    expect(result.model).toBe("gemini");
    expect(mocks.callLLM).toHaveBeenNthCalledWith(2, "gemini", messages, { fallbackToManus: false });
  });

  it("rejects empty provider responses and continues", async () => {
    mocks.callLLM
      .mockResolvedValueOnce({ content: "", model: "deepseek" })
      .mockResolvedValueOnce({ content: "Usable response", model: "gemini" });

    await expect(callAriaLLM(messages)).resolves.toMatchObject({ content: "Usable response" });
  });

  it("throws only after every provider fails", async () => {
    mocks.callLLM.mockRejectedValue(new Error("offline"));

    await expect(callAriaLLM(messages)).rejects.toThrow("All Aria LLM providers failed");
    expect(mocks.callLLM).toHaveBeenCalledTimes(4);
  });
});
