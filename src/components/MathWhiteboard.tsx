"use client";

import { useState } from "react";

interface MathWhiteboardProps {
  boardUrl?: string;
  sessionId?: string;
  className?: string;
}

export function MathWhiteboard({
  boardUrl,
  className = "",
}: MathWhiteboardProps) {
  const [isLoading, setIsLoading] = useState(true);

  const url = boardUrl || "https://mathwhiteboard.com";

  return (
    <div
      className={`relative bg-white rounded-xl overflow-hidden border border-slate-200 ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading whiteboard...</p>
          </div>
        </div>
      )}

      <iframe
        src={url}
        className="w-full h-full min-h-[500px] border-0"
        onLoad={() => setIsLoading(false)}
        allow="clipboard-write"
        title="Math Whiteboard"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />

      <div className="absolute top-3 right-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-white/90 backdrop-blur text-sm text-slate-700 rounded-lg shadow-md hover:bg-white transition-colors flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          New Window
        </a>
      </div>
    </div>
  );
}
