'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  DesmosConfig,
  DesmosState,
  DEFAULT_DESMOS_CONFIG,
  getDesmosApiUrl,
} from '@/lib/desmos';

// Declare Desmos types
declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: new (
        element: HTMLElement,
        options?: DesmosConfig
      ) => DesmosCalculatorInstance;
    };
  }
}

interface DesmosCalculatorInstance {
  getState: () => DesmosState;
  setState: (state: DesmosState) => void;
  setBlank: () => void;
  setExpression: (expression: { id: string; latex?: string; color?: string }) => void;
  removeExpression: (expression: { id: string }) => void;
  setMathBounds: (bounds: { left: number; right: number; top: number; bottom: number }) => void;
  screenshot: (options?: { width?: number; height?: number; targetPixelRatio?: number }) => string;
  destroy: () => void;
  observeEvent: (event: string, callback: () => void) => void;
  unobserveEvent: (event: string) => void;
}

interface DesmosCalculatorProps {
  className?: string;
  config?: Partial<DesmosConfig>;
  initialState?: DesmosState;
  onStateChange?: (state: DesmosState) => void;
  onReady?: (calculator: DesmosCalculatorInstance) => void;
}

export function DesmosCalculator({
  className = '',
  config = {},
  initialState,
  onStateChange,
  onReady,
}: DesmosCalculatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculatorInstance | null>(null);
  const scriptLoadedRef = useRef(false);

  const initializeCalculator = useCallback(() => {
    if (!containerRef.current || !window.Desmos) return;

    // Destroy existing calculator
    if (calculatorRef.current) {
      calculatorRef.current.destroy();
    }

    // Create calculator with merged config
    const mergedConfig = { ...DEFAULT_DESMOS_CONFIG, ...config };
    const calculator = new window.Desmos.GraphingCalculator(
      containerRef.current,
      mergedConfig
    );

    calculatorRef.current = calculator;

    // Set initial state if provided
    if (initialState) {
      calculator.setState(initialState);
    }

    // Set up state change observer
    if (onStateChange) {
      calculator.observeEvent('change', () => {
        const state = calculator.getState();
        onStateChange(state);
      });
    }

    // Notify ready
    if (onReady) {
      onReady(calculator);
    }
  }, [config, initialState, onStateChange, onReady]);

  useEffect(() => {
    // Load Desmos API script
    if (!scriptLoadedRef.current && !window.Desmos) {
      const script = document.createElement('script');
      script.src = getDesmosApiUrl();
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeCalculator();
      };
      document.head.appendChild(script);
    } else if (window.Desmos) {
      scriptLoadedRef.current = true;
      initializeCalculator();
    }

    return () => {
      if (calculatorRef.current) {
        if (onStateChange) {
          calculatorRef.current.unobserveEvent('change');
        }
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
  }, [initializeCalculator, onStateChange]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] ${className}`}
      style={{ background: '#fff' }}
    />
  );
}

/**
 * Compact calculator for inline use
 */
export function DesmosCalculatorCompact({
  className = '',
  initialLatex,
}: {
  className?: string;
  initialLatex?: string;
}) {
  return (
    <DesmosCalculator
      className={`h-[300px] ${className}`}
      config={{
        keypad: false,
        expressionsTopbar: false,
        settingsMenu: false,
        expressions: true,
        border: true,
      }}
      initialState={
        initialLatex
          ? {
              version: 10,
              randomSeed: '',
              graph: { viewport: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 } },
              expressions: {
                list: [{ id: '1', type: 'expression', latex: initialLatex }],
              },
            }
          : undefined
      }
    />
  );
}

/**
 * Full-screen calculator for tutoring sessions
 */
export function DesmosCalculatorFull({
  className = '',
  onStateChange,
  initialState,
}: {
  className?: string;
  onStateChange?: (state: DesmosState) => void;
  initialState?: DesmosState;
}) {
  return (
    <DesmosCalculator
      className={`min-h-[500px] ${className}`}
      config={{
        keypad: true,
        expressionsTopbar: true,
        settingsMenu: true,
        expressions: true,
        border: false,
        projectorMode: true,
        fontSize: 18,
      }}
      onStateChange={onStateChange}
      initialState={initialState}
    />
  );
}
