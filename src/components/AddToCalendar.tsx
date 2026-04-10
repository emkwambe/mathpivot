'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AddToCalendarProps {
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  className?: string;
}

export function AddToCalendar({
  title,
  description = '',
  startAt,
  endAt,
  location,
  className,
}: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Format date for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  // Format date for ICS (YYYYMMDDTHHMMSS)
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${formatGoogleDate(startAt)}/${formatGoogleDate(endAt)}`,
      details: description,
    });

    if (location) {
      params.set('location', location);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate Outlook.com URL
  const getOutlookUrl = () => {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: title,
      startdt: startAt.toISOString(),
      enddt: endAt.toISOString(),
      body: description,
    });

    if (location) {
      params.set('location', location);
    }

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  // Generate Office 365 URL
  const getOffice365Url = () => {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: title,
      startdt: startAt.toISOString(),
      enddt: endAt.toISOString(),
      body: description,
    });

    if (location) {
      params.set('location', location);
    }

    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  // Generate ICS file content
  const generateICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MathPivot//TutorOS//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startAt)}`,
      `DTEND:${formatICSDate(endAt)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      location ? `LOCATION:${location}` : '',
      `UID:${new Date().getTime()}@mathpivot.com`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  };

  const calendarOptions = [
    {
      name: 'Google Calendar',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 4H18V3a1 1 0 00-2 0v1H8V3a1 1 0 00-2 0v1H4.5A2.5 2.5 0 002 6.5v13A2.5 2.5 0 004.5 22h15a2.5 2.5 0 002.5-2.5v-13A2.5 2.5 0 0019.5 4zM4 9h16v10.5a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5V9z" />
        </svg>
      ),
      getUrl: getGoogleCalendarUrl,
      color: 'text-blue-600',
    },
    {
      name: 'Outlook.com',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      ),
      getUrl: getOutlookUrl,
      color: 'text-blue-500',
    },
    {
      name: 'Office 365',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 4.5v15c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5v-15c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5zM7 8h10v2H7V8zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
        </svg>
      ),
      getUrl: getOffice365Url,
      color: 'text-orange-500',
    },
    {
      name: 'Apple Calendar',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
      getUrl: generateICS,
      color: 'text-slate-700',
      download: true,
    },
  ];

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Add to Calendar
        <svg
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="p-2">
              {calendarOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.getUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={option.download ? `${title.replace(/\s+/g, '_')}.ics` : undefined}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className={option.color}>{option.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

