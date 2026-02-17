import type { LLMResponse, ChatMessage } from "./types";

export async function sendChatMessage(
  documentContext: string,
  messages: Pick<ChatMessage, "role" | "content">[]
): Promise<LLMResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentContext, messages }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed (${res.status})`);
  }

  return res.json();
}
