'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  highlightedDates?: Date[];
  disabledDates?: Date[];
  className?: string;
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  highlightedDates = [],
  disabledDates = [],
  className,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const highlightedSet = useMemo(() => {
    return new Set(highlightedDates.map(d => format(d, 'yyyy-MM-dd')));
  }, [highlightedDates]);

  const disabledSet = useMemo(() => {
    return new Set(disabledDates.map(d => format(d, 'yyyy-MM-dd')));
  }, [disabledDates]);

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (disabledSet.has(dateStr)) return true;
    if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) return true;
    if (maxDate && isAfter(startOfDay(date), startOfDay(maxDate))) return true;
    return false;
  };

  const isDateHighlighted = (date: Date): boolean => {
    return highlightedSet.has(format(date, 'yyyy-MM-dd'));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isDisabled = isDateDisabled(day);
          const isHighlighted = isDateHighlighted(day);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={index}
              type="button"
              onClick={() => !isDisabled && onDateSelect(day)}
              disabled={isDisabled || !isCurrentMonth}
              className={cn(
                'relative aspect-square flex items-center justify-center text-sm rounded-lg transition-all',
                !isCurrentMonth && 'text-slate-300 cursor-default',
                isCurrentMonth && !isDisabled && !isSelected && 'hover:bg-slate-100 cursor-pointer',
                isCurrentMonth && isDisabled && 'text-slate-300 cursor-not-allowed',
                isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
                !isSelected && isHighlighted && isCurrentMonth && 'bg-blue-50 text-blue-700 font-medium',
                isToday && !isSelected && 'ring-2 ring-blue-200 ring-inset'
              )}
            >
              {format(day, 'd')}
              {/* Highlighted indicator dot */}
              {isHighlighted && !isSelected && isCurrentMonth && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {highlightedDates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-blue-50 rounded border border-blue-200" />
            <span>Recommended</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-blue-600 rounded" />
            <span>Selected</span>
          </div>
        </div>
      )}
    </div>
  );
}
