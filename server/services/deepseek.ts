export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekRequest {
  messages: DeepSeekMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export async function callDeepSeek({
  messages,
  maxTokens = 1600,
  temperature = 0.25,
  jsonMode = false,
  timeoutMs = 30_000,
}: DeepSeekRequest): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error?.message || body?.message || `HTTP ${response.status}`;
      throw new Error(`DeepSeek request failed: ${message}`);
    }

    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("DeepSeek returned an empty response");
    }

    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}
