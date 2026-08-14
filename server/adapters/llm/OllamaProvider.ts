import {
  LLMProvider,
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProviderError,
} from "./LLMProvider";

export class OllamaProvider implements LLMProvider {
  public readonly name = "ollama";
  private baseUrl: string;
  private model: string;
  public readonly enabled: boolean;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    this.model = model ?? process.env.OLLAMA_MODEL ?? "qwen2.5:14b";
    this.enabled = Boolean(this.baseUrl);
  }

  async complete(input: LLMCompletionInput): Promise<LLMCompletionResult> {
    const started = Date.now();
    try {
      const messages = input.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: input.model ?? this.model,
          messages,
          stream: false,
          options: {
            temperature: input.temperature ?? 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - started;
      return {
        content: data.message?.content ?? "",
        latencyMs,
        provider: this.name,
        model: input.model ?? this.model,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - started;
      throw new LLMProviderError(
        err.message ?? "Ollama request failed",
        this.name,
        true
      );
    }
  }
}
