'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Suggestion {
  date: string;
  startTime: string;
  endTime: string;
  tutorId: string;
  tutorName: string;
  reason: string;
  score: number;
}

interface SchedulingSuggestionsProps {
  studentId: string;
  onSelectSuggestion?: (suggestion: Suggestion) => void;
}

export function SchedulingSuggestions({ studentId, onSelectSuggestion }: SchedulingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/scheduling/suggestions?studentId=${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        } else {
          throw new Error('Failed to load suggestions');
        }
      } catch (err) {
        setError('Unable to load scheduling suggestions');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (studentId) {
      loadSuggestions();
    }
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Finding optimal times...</h3>
            <p className="text-sm text-slate-600">Analyzing schedule patterns</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">AI Scheduling Suggestions</h3>
          <p className="text-sm text-slate-600">Based on your child&apos;s learning patterns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.slice(0, 6).map((suggestion, index) => (
          <button
            key={`${suggestion.date}-${suggestion.startTime}-${index}`}
            onClick={() => onSelectSuggestion?.(suggestion)}
            className={cn(
              'text-left p-4 rounded-lg border-2 transition-all hover:scale-[1.02]',
              index === 0
                ? 'bg-white border-blue-300 shadow-md'
                : 'bg-white/70 border-transparent hover:border-blue-200 hover:bg-white'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {format(parseISO(suggestion.date), 'EEE, MMM d')}
                </p>
                <p className="text-sm text-slate-600">
                  {suggestion.startTime} - {suggestion.endTime}
                </p>
              </div>
              {index === 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  Best Match
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 mb-2">
              with <span className="font-medium">{suggestion.tutorName}</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {suggestion.reason}
            </p>
            {/* Confidence indicator */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${suggestion.score * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">
                {Math.round(suggestion.score * 100)}% match
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
