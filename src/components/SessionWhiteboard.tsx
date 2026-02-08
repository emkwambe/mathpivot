'use client';

import { useState } from 'react';

interface SessionWhiteboardProps {
  sessionId: string;
  studentName?: string;
  readonly?: boolean;
}

/**
 * Session Whiteboard - Math Whiteboard Integration
 *
 * Uses mathwhiteboard.com for collaborative math tutoring.
 * Features: handwriting recognition, graphing, LaTeX support.
 *
 * Note: Use alongside video call (Zoom/Meet) for voice communication.
 */
export function SessionWhiteboard({ sessionId, studentName, readonly = false }: SessionWhiteboardProps) {
  const [showDesmos, setShowDesmos] = useState(false);

  const openWhiteboard = () => {
    window.open('https://mathwhiteboard.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Whiteboard Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title & Description */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Math Whiteboard
            </h3>
            <p className="text-slate-600 text-sm">
              Collaborative whiteboard with handwriting recognition, graphing calculator,
              and LaTeX equation support. Perfect for math tutoring sessions.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-lg">
            <FeatureBadge icon="✍️" label="Handwriting" />
            <FeatureBadge icon="📈" label="Graphing" />
            <FeatureBadge icon="∑" label="LaTeX" />
            <FeatureBadge icon="📄" label="PDF Import" />
          </div>

          {/* Action Buttons */}
          {!readonly && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openWhiteboard}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Whiteboard {studentName ? `with ${studentName}` : ''}
              </button>

              <button
                onClick={() => setShowDesmos(!showDesmos)}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-lg transition-all ${
                  showDesmos
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                {showDesmos ? 'Hide Calculator' : 'Desmos Calculator'}
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Tip: Share the whiteboard URL with your student. Use Zoom/Meet for voice communication.
            </p>
          </div>
        </div>
      </div>

      {/* Desmos Calculator (toggleable) */}
      {showDesmos && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="font-medium text-slate-700">Desmos Graphing Calculator</span>
            </div>
            <button
              onClick={() => setShowDesmos(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <iframe
            src="https://www.desmos.com/calculator"
            className="w-full h-[450px]"
            title="Desmos Graphing Calculator"
            allow="clipboard-write"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

function FeatureBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-slate-50 rounded-lg">
      <span className="text-xl">{icon}</span>
      <span className="text-xs text-slate-600 font-medium">{label}</span>
    </div>
  );
}
