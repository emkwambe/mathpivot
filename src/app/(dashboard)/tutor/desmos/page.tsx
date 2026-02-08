'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface DesmosCalculator {
  destroy: () => void;
  setExpression: (expr: { id: string; latex: string; color?: string }) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

interface DesmosAPI {
  GraphingCalculator: (element: HTMLElement, options?: {
    expressions?: boolean;
    settingsMenu?: boolean;
    zoomButtons?: boolean;
    expressionsTopbar?: boolean;
    pointsOfInterest?: boolean;
    trace?: boolean;
    border?: boolean;
    lockViewport?: boolean;
    expressionsCollapsed?: boolean;
  }) => DesmosCalculator;
}

export default function DesmosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculator | null>(null);

  useEffect(() => {
    // Load Desmos API script
    const script = document.createElement('script');
    script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Desmos = (window as any).Desmos as DesmosAPI | undefined;
      if (containerRef.current && Desmos) {
        calculatorRef.current = Desmos.GraphingCalculator(containerRef.current, {
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          expressionsTopbar: true,
          pointsOfInterest: true,
          trace: true,
          border: false,
          lockViewport: false,
          expressionsCollapsed: false,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
      }
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tutor"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Desmos Graphing Calculator</span>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Powered by Desmos
        </div>
      </div>

      {/* Calculator Container */}
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}
