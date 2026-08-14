export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCalls?: LLMToolCall[];
  toolCallId?: string;
}

export interface LLMToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LLMCompletionInput {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: LLMToolDefinition[];
  toolChoice?: "auto" | "none" | { type: "function"; function: { name: string } };
}

export interface LLMCompletionResult {
  content: string;
  toolCalls?: LLMToolCall[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
  provider: string;
  model: string;
  finishReason?: string;
  errorReason?: string;
}

export interface LLMProvider {
  readonly name: string;
  readonly enabled: boolean;
  complete(input: LLMCompletionInput): Promise<LLMCompletionResult>;
}

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly isRetryable = false
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}
