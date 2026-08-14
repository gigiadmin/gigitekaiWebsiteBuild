import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  LLMProvider,
  LLMCompletionInput,
  LLMCompletionResult,
  LLMProviderError,
  LLMToolCall,
} from "./LLMProvider";

export class GeminiProvider implements LLMProvider {
  public readonly name = "gemini";
  private apiKey: string | undefined;
  public readonly enabled: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY;
    this.enabled = Boolean(this.apiKey);
  }

  async complete(input: LLMCompletionInput): Promise<LLMCompletionResult> {
    if (!this.apiKey) {
      throw new LLMProviderError("Gemini API key not configured", this.name, false);
    }
    const started = Date.now();
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: input.model ?? "gemini-1.5-flash",
      });

      const systemInstruction = input.messages.find((m) => m.role === "system")?.content;
      const contents = input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const result = await model.generateContent({
        contents,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxTokens ?? 1024,
        },
      });

      const latencyMs = Date.now() - started;
      const response = result.response;
      const text = response.text();

      // Gemini does not expose tool calls in the same shape; we return plain text
      return {
        content: text,
        latencyMs,
        provider: this.name,
        model: input.model ?? "gemini-1.5-flash",
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount,
        },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - started;
      const retryable = err.status >= 500 || err.message?.includes("timeout");
      throw new LLMProviderError(
        err.message ?? "Gemini request failed",
        this.name,
        retryable
      );
    }
  }
}
