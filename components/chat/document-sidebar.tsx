"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import type { DocumentInfo } from "@/lib/types";

interface DocumentSidebarProps {
  document: DocumentInfo;
}

export function DocumentSidebar({ document }: DocumentSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900 transition-all duration-300 ${
        collapsed ? "w-10" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 px-3 py-2">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {document.fileName}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Document info */}
          <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 p-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Pages</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {document.pageCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Characters</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {document.totalChars.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Page list */}
          <div className="overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <div className="space-y-1">
              {document.pages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="rounded-lg px-2.5 py-2 text-xs hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                    <Hash className="h-3 w-3 shrink-0" />
                    <span className="font-medium">Page {page.pageNumber}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 leading-relaxed">
                    {page.text.slice(0, 120) || "No text content"}
                    {page.text.length > 120 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
