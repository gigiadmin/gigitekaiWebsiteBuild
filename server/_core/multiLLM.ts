/**
 * Multi-Model LLM Router
 * Supports Claude (Anthropic), Manus LLM (built-in), and Gemini (Google)
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { invokeLLM } from "./llm";

export type LLMModel = "claude" | "manus" | "gemini" | "deepseek";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: LLMModel;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

/**
 * Call Claude (Anthropic) directly
 */
async function callClaude(messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("CLAUDE_API_KEY not configured");

  const client = new Anthropic({ apiKey });

  // Separate system message from conversation
  const systemMsg = messages.find((m) => m.role === "system")?.content;
  const conversationMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: systemMsg,
    messages: conversationMsgs,
  });

  const content =
    response.content[0].type === "text" ? response.content[0].text : "";

  return {
    content,
    model: "claude",
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

/**
 * Call Gemini (Google) directly
 */
async function callGemini(messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Build prompt with system context
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const conversationMsgs = messages.filter((m) => m.role !== "system");

  // Build chat history (all but last message)
  const history = conversationMsgs.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history,
    systemInstruction: systemMsg,
  });

  const lastMsg = conversationMsgs[conversationMsgs.length - 1];
  const result = await chat.sendMessage(lastMsg?.content || "");
  const content = result.response.text();

  return {
    content,
    model: "gemini",
    usage: {
      inputTokens: result.response.usageMetadata?.promptTokenCount,
      outputTokens: result.response.usageMetadata?.candidatesTokenCount,
    },
  };
}

/**
 * Call DeepSeek (OpenAI-compatible API)
 */
async function callDeepSeek(messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 1024,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`DeepSeek API error ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content || "No response";

  return {
    content,
    model: "deepseek",
    usage: {
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    },
  };
}

/**
 * Call Manus built-in LLM
 */
async function callManus(messages: LLMMessage[]): Promise<LLMResponse> {
  const response = await invokeLLM({
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content =
    typeof response.choices?.[0]?.message?.content === "string"
      ? response.choices[0].message.content
      : "No response";

  return {
    content,
    model: "manus",
  };
}

/**
 * Route to the appropriate LLM based on model selection
 * Falls back to Manus if the selected model is unavailable
 */
export async function callLLM(
  model: LLMModel,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  try {
    switch (model) {
      case "claude":
        return await callClaude(messages);
      case "gemini":
        return await callGemini(messages);
      case "deepseek":
        return await callDeepSeek(messages);
      case "manus":
      default:
        return await callManus(messages);
    }
  } catch (error) {
    console.error(`[MultiLLM] ${model} failed, falling back to Manus:`, error);
    // Fallback to Manus LLM
    return await callManus(messages);
  }
}

/**
 * Get available models with their status
 */
export function getAvailableModels(): Array<{
  id: LLMModel;
  name: string;
  description: string;
  available: boolean;
  badge?: string;
}> {
  return [
    {
      id: "deepseek",
      name: "DeepSeek Chat",
      description: "Fast, cost-effective reasoning. Great for IT operations and code.",
      available: !!process.env.DEEPSEEK_API_KEY,
      badge: "Primary",
    },
    {
      id: "claude",
      name: "Claude 3.5 Sonnet",
      description: "Best reasoning and analysis. Ideal for complex queries.",
      available: !!process.env.CLAUDE_API_KEY,
      badge: "Premium",
    },
    {
      id: "gemini",
      name: "Gemini 1.5 Flash",
      description: "Fast and cost-effective. Great for quick lookups.",
      available: !!process.env.GEMINI_API_KEY,
      badge: "Fast",
    },
    {
      id: "manus",
      name: "Manus LLM",
      description: "Built-in AI. Always available, no external API needed.",
      available: true,
      badge: "Default",
    },
  ];
}
