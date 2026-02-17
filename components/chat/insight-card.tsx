"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Eye,
  ChevronDown,
  Database,
} from "lucide-react";
import type { InsightItem, QueryResult } from "@/lib/types";

interface InsightCardProps {
  summary: string;
  items: InsightItem[];
  steps?: { sql: string; reasoning: string; result?: QueryResult }[];
}

const typeConfig: Record<
  InsightItem["type"],
  { icon: typeof TrendingUp; label: string; color: string }
> = {
  trend: { icon: TrendingUp, label: "Trend", color: "text-blue-500 bg-blue-500/10" },
  anomaly: { icon: AlertTriangle, label: "Anomaly", color: "text-orange-500 bg-orange-500/10" },
  recommendation: { icon: Lightbulb, label: "Recommendation", color: "text-purple-500 bg-purple-500/10" },
  observation: { icon: Eye, label: "Observation", color: "text-cyan-500 bg-cyan-500/10" },
};

const priorityColors: Record<InsightItem["priority"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

export function InsightCard({ summary, items, steps }: InsightCardProps) {
  const [stepsOpen, setStepsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
        {summary}
      </div>

      {/* Insight items */}
      <div className="space-y-2">
        {items.map((item, i) => {
          const config = typeConfig[item.type] || typeConfig.observation;
          const Icon = config.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3"
            >
              {/* Priority dot */}
              <div className="mt-1.5 flex shrink-0">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${priorityColors[item.priority]}`}
                />
              </div>

              <div className="flex-1 space-y-1">
                {/* Type badge + title */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${config.color}`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {item.title}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Collapsible analysis steps */}
      {steps && steps.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <button
            onClick={() => setStepsOpen(!stepsOpen)}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Analysis Steps ({steps.length} queries)</span>
            <ChevronDown
              className={`ml-auto h-3.5 w-3.5 transition-transform ${stepsOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {stepsOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 p-3">
                  {steps.map((step, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs text-zinc-500">
                        <span className="font-medium">Step {i + 1}:</span>{" "}
                        {step.reasoning}
                      </p>
                      <pre className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2 text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto">
                        {step.sql}
                      </pre>
                      {step.result && (
                        <p className="text-xs text-zinc-400">
                          {step.result.rowCount} row{step.result.rowCount !== 1 ? "s" : ""} returned
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
