import {
  callLLM,
  type LLMMessage,
  type LLMModel,
  type LLMResponse,
} from "../_core/multiLLM";

const ARIA_PROVIDER_ORDER: LLMModel[] = [
  "deepseek",
  "gemini",
  "claude",
  "manus",
];

/**
 * Resolve an Aria response through independent providers before the Manus
 * built-in model. This keeps public chat available when one provider or the
 * project credit-backed gateway is unavailable.
 */
export async function callAriaLLM(messages: LLMMessage[]): Promise<LLMResponse> {
  const failures: string[] = [];

  for (const provider of ARIA_PROVIDER_ORDER) {
    try {
      const response = await callLLM(provider, messages, { fallbackToManus: false });
      const content = response.content?.trim();

      if (!content || content === "No response") {
        throw new Error("provider returned an empty response");
      }

      if (failures.length > 0) {
        console.warn(`[Aria LLM] Recovered with ${provider} after: ${failures.join("; ")}`);
      }

      return { ...response, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${provider}: ${message}`);
      console.warn(`[Aria LLM] ${provider} unavailable: ${message}`);
    }
  }

  throw new Error(`All Aria LLM providers failed: ${failures.join(" | ")}`);
}
