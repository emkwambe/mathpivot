'use client';

import { useState } from 'react';

interface MathWhiteboardProps {
  boardUrl?: string;
  sessionId?: string;
  className?: string;
  onBoardCreated?: (url: string) => void;
}

/**
 * Math Whiteboard Integration
 *
 * Embeds mathwhiteboard.com - a free, math-focused collaborative whiteboard
 * Features: handwriting recognition, graphing, LaTeX support, PDF annotation
 *
 * Note: No built-in video - use alongside Zoom/Meet for voice communication
 *
 * Future upgrade path: LiveBoard ($10/mo) for integrated video + more features
 */
export function MathWhiteboard({
  boardUrl,
  sessionId,
  className = '',
  onBoardCreated
}: MathWhiteboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(!boardUrl);

  // Math Whiteboard base URL
  const MATH_WHITEBOARD_URL = 'https://mathwhiteboard.com';

  // Generate a new board URL (boards are created on the fly)
  const createNewBoard = () => {
    // Math Whiteboard creates boards dynamically when you visit the site
    // Each visit creates a unique collaborative space
    const newBoardUrl = MATH_WHITEBOARD_URL;
    setShowInstructions(false);
    onBoardCreated?.(newBoardUrl);

    // Open in new tab for best experience (Math Whiteboard works better full-screen)
    window.open(newBoardUrl, '_blank', 'noopener,noreferrer');
  };

  if (showInstructions) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl ${className}`}>
        <div className="max-w-md text-center space-y-6">
          {/* Math Whiteboard Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Math Whiteboard
            </h3>
            <p className="text-slate-600 text-sm">
              Free collaborative whiteboard with math-specific tools: handwriting recognition,
              graphing calculator, LaTeX equations, and PDF annotation.
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Handwriting Recognition
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Graph Plotting
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              LaTeX Equations
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              PDF Annotation
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={createNewBoard}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            Open Math Whiteboard
          </button>

          {/* Tip */}
          <p className="text-xs text-slate-500">
            Tip: Share the whiteboard URL with your student for real-time collaboration.
            Use Zoom or Google Meet for voice/video alongside.
          </p>
        </div>
      </div>
    );
  }

  // Embedded view (if boardUrl provided)
  return (
    <div className={`relative bg-white rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <div className="flex items-center gap-2 text-slate-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading whiteboard...
          </div>
        </div>
      )}

      <iframe
        src={boardUrl || MATH_WHITEBOARD_URL}
        className="w-full h-full min-h-[500px] border-0"
        onLoad={() => setIsLoading(false)}
        allow="clipboard-write"
        title="Math Whiteboard"
      />

      {/* Floating action bar */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          onClick={() => window.open(boardUrl || MATH_WHITEBOARD_URL, '_blank')}
          className="px-3 py-1.5 bg-white/90 backdrop-blur text-sm text-slate-700 rounded-lg shadow-md hover:bg-white transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open Full Screen
        </button>
      </div>
    </div>
  );
}

/**
 * Simple whiteboard launcher for session context
 */
export function SessionWhiteboardLauncher({
  sessionId,
  studentName
}: {
  sessionId: string;
  studentName?: string;
}) {
  const openWhiteboard = () => {
    window.open('https://mathwhiteboard.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={openWhiteboard}
      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      Open Whiteboard {studentName ? `with ${studentName}` : ''}
    </button>
  );
}
