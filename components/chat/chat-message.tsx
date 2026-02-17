"use client";

import { motion } from "framer-motion";
import { User, Bot, Loader2, BookOpen } from "lucide-react";
import { InsightCard } from "./insight-card";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasInsights = !isUser && message.insights;
  const hasInsightSteps = !isUser && message.insightSteps && message.insightSteps.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-secondary/20" : "bg-primary/20"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-secondary" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Content */}
      <div
        className={`max-w-[80%] space-y-3 ${isUser ? "text-right" : ""}`}
      >
        {/* Insight mode: show steps progress while loading */}
        {hasInsightSteps && message.loading && !hasInsights && (
          <div className="space-y-2">
            {message.insightSteps!.map((step, i) => (
              <div
                key={i}
                className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400"
              >
                <span className="font-medium">Step {i + 1}:</span> {step.reasoning}
              </div>
            ))}
            <div className="flex items-center gap-2 px-1">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-zinc-500">
                Analyzing... (step {message.insightSteps!.length + 1})
              </span>
            </div>
          </div>
        )}

        {/* Insight mode: final insights */}
        {hasInsights && (
          <InsightCard
            summary={message.insights!.summary}
            items={message.insights!.items}
            steps={message.insightSteps}
          />
        )}

        {/* Regular message bubble (only if not an insight message) */}
        {!hasInsights && !(hasInsightSteps && message.loading) && (
          <div
            className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${
              isUser
                ? "bg-secondary/20 text-foreground"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {message.loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-zinc-600 dark:text-zinc-400">Thinking...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        )}

        {/* Page references */}
        {!isUser && message.pages && message.pages.length > 0 && !message.loading && (
          <div className="text-left">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              <span>
                Referenced pages: {message.pages.join(", ")}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
