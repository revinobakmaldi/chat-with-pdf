import type { LLMResponse, ChatMessage, InsightAgentResponse } from "./types";

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

export function validateInsightResponse(data: unknown): InsightAgentResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid insight response: not an object");
  }

  const obj = data as Record<string, unknown>;

  if (obj.action === "query") {
    if (typeof obj.sql !== "string" || typeof obj.reasoning !== "string") {
      throw new Error("Invalid query response: missing sql or reasoning");
    }
    return { action: "query", sql: obj.sql, reasoning: obj.reasoning };
  }

  if (obj.action === "insight") {
    if (typeof obj.summary !== "string" || !Array.isArray(obj.insights)) {
      throw new Error("Invalid insight response: missing summary or insights");
    }
    return {
      action: "insight",
      summary: obj.summary,
      insights: obj.insights,
    };
  }

  throw new Error(`Invalid insight response: unknown action "${obj.action}"`);
}

export async function sendInsightMessage(
  schema: string,
  messages: Pick<ChatMessage, "role" | "content">[]
): Promise<InsightAgentResponse> {
  const res = await fetch("/api/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schema, messages }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed (${res.status})`);
  }

  const data = await res.json();
  return validateInsightResponse(data);
}
