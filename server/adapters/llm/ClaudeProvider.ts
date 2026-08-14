import Anthropic from "@anthropic-ai/sdk";
import {
  LLMProvider,
  LLMCompletionInput,
  LLMCompletionResult,
  LLMMessage,
  LLMToolCall,
  LLMProviderError,
} from "./LLMProvider";

export class ClaudeProvider implements LLMProvider {
  public readonly name = "claude";
  private client: Anthropic;
  public readonly enabled: boolean;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.CLAUDE_API_KEY;
    this.enabled = Boolean(key);
    this.client = new Anthropic({ apiKey: key });
  }

  async complete(input: LLMCompletionInput): Promise<LLMCompletionResult> {
    if (!this.enabled) {
      throw new LLMProviderError("Claude API key not configured", this.name, false);
    }
    const started = Date.now();
    try {
      const systemMsg = input.messages.find((m) => m.role === "system")?.content;
      const messages = input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: input.model ?? "claude-3-5-sonnet-20241022",
        max_tokens: input.maxTokens ?? 1024,
        temperature: input.temperature ?? 0.7,
        system: systemMsg,
        messages,
        tools: input.tools as any,
        tool_choice: input.toolChoice as any,
      });

      const latencyMs = Date.now() - started;
      const content = response.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");
      const toolCalls = response.content
        .filter((c) => c.type === "tool_use")
        .map((c) => ({
          id: c.id,
          type: "function" as const,
          function: {
            name: c.name,
            arguments: JSON.stringify(c.input),
          },
        }));

      return {
        content,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        usage: {
          promptTokens: response.usage?.input_tokens,
          completionTokens: response.usage?.output_tokens,
          totalTokens:
            (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
        },
        latencyMs,
        provider: this.name,
        model: response.model,
        finishReason: response.stop_reason ?? undefined,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - started;
      const retryable = err.status >= 500 || err.code === "timeout";
      throw new LLMProviderError(
        err.message ?? "Claude request failed",
        this.name,
        retryable
      );
    }
  }
}
