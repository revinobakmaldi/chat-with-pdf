"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { DocumentSidebar } from "./document-sidebar";
import { sendChatMessage, sendInsightMessage } from "@/lib/api";
import { buildDocumentContext, generateSuggestedQuestions } from "@/lib/prompt";
import type {
  DocumentInfo,
  ChatMessage as ChatMessageType,
  LLMResponse,
  QueryResult,
} from "@/lib/types";

interface ChatContainerProps {
  document: DocumentInfo;
}

const MAX_INSIGHT_ITERATIONS = 5;

export function ChatContainer({ document }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const documentContext = buildDocumentContext(document);
  const suggestedQuestions = messages.length === 0
    ? generateSuggestedQuestions(document)
    : undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      if (isLoading) return;

      const userMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      const assistantMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      try {
        const historyForApi = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const llmResponse: LLMResponse = await sendChatMessage(
          documentContext,
          historyForApi
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: llmResponse.answer,
                  pages: llmResponse.pages,
                  loading: false,
                }
              : m
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: errorMessage,
                  loading: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, documentContext]
  );

  const handleInsight = useCallback(
    async (topic?: string) => {
      if (isLoading) return;

      const userContent = topic || "Analyze my data and provide insights";
      const userMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "user",
        content: userContent,
      };

      const assistantMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        loading: true,
        insightSteps: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      // Build schema from document context for the insight agent
      const schema = documentContext;

      // Conversation history for the insight API
      const conversationHistory: { role: "user" | "assistant"; content: string }[] = [
        { role: "user", content: userContent },
      ];

      const steps: ChatMessageType["insightSteps"] = [];

      try {
        for (let i = 0; i < MAX_INSIGHT_ITERATIONS; i++) {
          const response = await sendInsightMessage(schema, conversationHistory);

          if (response.action === "query") {
            // Execute the SQL query via DuckDB-WASM (if available)
            let result: QueryResult;
            try {
              result = await executeSqlInDuckDB(response.sql);
            } catch {
              result = {
                columns: ["error"],
                rows: [{ error: "DuckDB not available — SQL execution skipped" }],
                rowCount: 0,
              };
            }

            steps.push({
              sql: response.sql,
              reasoning: response.reasoning,
              result,
            });

            // Update message in state to show progress
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, insightSteps: [...steps] }
                  : m
              )
            );

            // Append results to conversation history for next iteration
            conversationHistory.push({
              role: "assistant",
              content: JSON.stringify({
                action: "query",
                sql: response.sql,
                reasoning: response.reasoning,
              }),
            });
            conversationHistory.push({
              role: "user",
              content: `Query results (${result.rowCount} rows):\n${JSON.stringify(result.rows.slice(0, 50), null, 2)}`,
            });
          } else if (response.action === "insight") {
            // Final insights received — update message and break
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? {
                      ...m,
                      content: response.summary,
                      loading: false,
                      insightSteps: [...steps],
                      insights: {
                        summary: response.summary,
                        items: response.insights,
                      },
                    }
                  : m
              )
            );
            return;
          }
        }

        // If we exhausted iterations without final insights
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: "Analysis completed but the agent did not produce final insights. Check the analysis steps below.",
                  loading: false,
                  insightSteps: [...steps],
                }
              : m
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: errorMessage,
                  loading: false,
                  insightSteps: [...steps],
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, documentContext]
  );

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      <DocumentSidebar document={document} />

      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
                  Ask a question about your PDF
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  I&apos;ll read the document and answer with page references
                </p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onInsight={handleInsight}
          disabled={isLoading}
          suggestedQuestions={suggestedQuestions}
        />
      </div>
    </div>
  );
}

/**
 * Execute SQL in DuckDB-WASM if available in the browser context.
 * This is a placeholder — replace with actual DuckDB-WASM integration.
 */
async function executeSqlInDuckDB(sql: string): Promise<QueryResult> {
  // Check if DuckDB is available on the window object
  const w = window as unknown as { _duckdb?: { query: (sql: string) => Promise<QueryResult> } };
  if (w._duckdb?.query) {
    return w._duckdb.query(sql);
  }
  throw new Error("DuckDB not initialized");
}
