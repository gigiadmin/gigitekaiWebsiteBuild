import { invokeLLM } from "./server/_core/llm.ts";

console.log("Testing LLM integration...");

const testMessage = {
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" }
  ]
};

try {
  const response = await invokeLLM(testMessage);
  console.log("LLM Response:", response);
} catch (error) {
  console.error("LLM Error:", error.message);
}
