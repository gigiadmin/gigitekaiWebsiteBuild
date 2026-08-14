import { ClaudeProvider } from "./ClaudeProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OllamaProvider } from "./OllamaProvider";
import { MultiLLMProvider, MultiLLMConfig } from "./MultiLLMProvider";
import { LLMProvider } from "./LLMProvider";

export function createLLMProvider(): LLMProvider {
  const primary = process.env.LLM_PRIMARY_PROVIDER ?? "claude";
  const fallback = process.env.LLM_FALLBACK_PROVIDER ?? "gemini";

  const providers = [new ClaudeProvider(), new GeminiProvider(), new OllamaProvider()];
  const config: MultiLLMConfig = { primary, fallback };
  return new MultiLLMProvider(providers, config);
}

let sharedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!sharedProvider) {
    sharedProvider = createLLMProvider();
  }
  return sharedProvider;
}

export function resetLLMProvider(): void {
  sharedProvider = null;
}
