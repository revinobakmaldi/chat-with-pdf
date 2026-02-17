export interface PageInfo {
  pageNumber: number;
  text: string;
}

export interface DocumentInfo {
  fileName: string;
  pageCount: number;
  pages: PageInfo[];
  totalChars: number;
}

export interface LLMResponse {
  answer: string;
  pages?: number[];
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface InsightItem {
  title: string;
  description: string;
  type: "trend" | "anomaly" | "recommendation" | "observation";
  priority: "high" | "medium" | "low";
}

export type InsightAgentResponse =
  | { action: "query"; sql: string; reasoning: string }
  | { action: "insight"; summary: string; insights: InsightItem[] };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pages?: number[];
  loading?: boolean;
  insightSteps?: { sql: string; reasoning: string; result?: QueryResult }[];
  insights?: { summary: string; items: InsightItem[] };
}

export type AppState = "upload" | "loading" | "ready" | "error";
