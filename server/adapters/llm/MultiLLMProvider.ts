import {
  LLMProvider,
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProviderError,
} from "./LLMProvider";

export interface MultiLLMConfig {
  primary: string;
  fallback?: string;
}

export class MultiLLMProvider implements LLMProvider {
  public readonly name = "multi";
  public readonly enabled = true;
  private providers: Map<string, LLMProvider>;
  private primary: string;
  private fallback?: string;

  constructor(providers: LLMProvider[], config: MultiLLMConfig) {
    this.providers = new Map(providers.map((p) => [p.name, p]));
    this.primary = config.primary;
    this.fallback = config.fallback;
  }

  async complete(input: LLMCompletionInput): Promise<LLMCompletionResult> {
    const order = [this.primary, this.fallback].filter((n): n is string => Boolean(n));
    const errors: string[] = [];

    for (const name of order) {
      const provider = this.providers.get(name);
      if (!provider || !provider.enabled) {
        errors.push(`${name}: not available`);
        continue;
      }
      try {
        return await provider.complete(input);
      } catch (err) {
        const msg = err instanceof LLMProviderError ? err.message : String(err);
        errors.push(`${name}: ${msg}`);
        if (err instanceof LLMProviderError && !err.isRetryable) {
          // Non-retryable (e.g., bad key) — skip to next provider
          continue;
        }
        // Retryable errors also fall through to next provider
      }
    }

    throw new LLMProviderError(
      `All LLM providers failed: ${errors.join("; ")}`,
      this.name,
      false
    );
  }
}
