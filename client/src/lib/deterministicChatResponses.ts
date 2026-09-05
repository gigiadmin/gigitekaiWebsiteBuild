export const BUSINESS_HOURS_RESPONSE =
  "**GigitekAI business hours are Monday–Friday, 8:00 AM–6:00 PM Eastern Time.** We are closed on weekends and U.S. federal holidays. You can leave a message at any time, and our team will follow up during the next business window.";

export function getDeterministicChatResponse(message: string): string | null {
  const normalized = message.toLowerCase().trim().replace(/[.!]+$/g, "");
  const asksForBusinessHours =
    /\b(?:business|support|office)\s+hours?\b/.test(normalized) ||
    /\bwhat\s+(?:are|is)\s+(?:you|your)\s+hours?\b/.test(normalized) ||
    /\bwhen\s+are\s+you\s+open\b/.test(normalized) ||
    /\bare\s+you\s+open\b/.test(normalized) ||
    /^(?:business\s+)?hours\??$/.test(normalized);

  return asksForBusinessHours ? BUSINESS_HOURS_RESPONSE : null;
}
