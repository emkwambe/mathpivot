"use client";

import { useState } from "react";

interface SessionWhiteboardProps {
  sessionId: string;
  studentName?: string;
  readonly?: boolean;
}

export function SessionWhiteboard({
  sessionId,
  studentName,
  readonly = false,
}: SessionWhiteboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"whiteboard" | "calculator">(
    "whiteboard",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const whiteboardUrl = "https://mathwhiteboard.com";
  const desmosUrl = "https://www.desmos.com/calculator";

  return (
    <div
      className={`rounded-xl border border-slate-200 overflow-hidden bg-white ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("whiteboard")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "whiteboard"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Whiteboard
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "calculator"
                ? "bg-green-600 text-white"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            Graphing Calculator
          </button>
        </div>

        <div className="flex items-center gap-2">
          {studentName && (
            <span className="text-xs text-slate-400">
              Session with {studentName}
            </span>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>
          <a
            href={activeTab === "whiteboard" ? whiteboardUrl : desmosUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            title="Open in new window"
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
          </a>
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">
                Loading{" "}
                {activeTab === "whiteboard" ? "whiteboard" : "calculator"}...
              </p>
            </div>
          </div>
        )}

        <iframe
          key={activeTab}
          src={activeTab === "whiteboard" ? whiteboardUrl : desmosUrl}
          className={`w-full border-0 ${isFullscreen ? "h-[calc(100vh-45px)]" : "h-[600px]"}`}
          onLoad={() => setIsLoading(false)}
          allow="clipboard-write"
          title={
            activeTab === "whiteboard"
              ? "Math Whiteboard"
              : "Desmos Graphing Calculator"
          }
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
