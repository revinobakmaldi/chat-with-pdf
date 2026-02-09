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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pages?: number[];
  loading?: boolean;
}

export type AppState = "upload" | "loading" | "ready" | "error";
