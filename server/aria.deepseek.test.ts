import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./services/deepseek", () => ({
  callDeepSeek: vi.fn(),
}));

import { callDeepSeek } from "./services/deepseek";
import { askAriaModel } from "./routers/aria";

describe("authenticated Aria DeepSeek provider", () => {
  beforeEach(() => {
    vi.mocked(callDeepSeek).mockReset();
  });

  it("routes portal questions and recent history through DeepSeek", async () => {
    vi.mocked(callDeepSeek).mockResolvedValue("The command center is operational.");

    const response = await askAriaModel("Summarize current operations", [
      { role: "user", content: "Show me open cases" },
      { role: "assistant", content: "I found the current queue." },
    ]);

    expect(response).toBe("The command center is operational.");
    expect(callDeepSeek).toHaveBeenCalledTimes(1);
    const request = vi.mocked(callDeepSeek).mock.calls[0][0];
    expect(request.messages[0].role).toBe("system");
    expect(request.messages.at(-1)).toEqual({ role: "user", content: "Summarize current operations" });
    expect(request.maxTokens).toBe(2000);
  });

  it("returns a safe portal error if DeepSeek is unavailable", async () => {
    vi.mocked(callDeepSeek).mockRejectedValue(new Error("provider unavailable"));
    await expect(askAriaModel("Test provider")).resolves.toContain("couldn't reach the AI service");
  });
});
