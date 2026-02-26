/**
 * Format time based on user preference (12h or 24h)
 */
export function formatTime(
  time: string, // HH:MM or HH:MM:SS format
  format: '12h' | '24h' = '12h'
): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a time range based on user preference
 */
export function formatTimeRange(
  startTime: string,
  endTime: string,
  format: '12h' | '24h' = '12h'
): string {
  return `${formatTime(startTime, format)} - ${formatTime(endTime, format)}`;
}

/**
 * Format a Date object's time based on user preference
 */
export function formatDateTime(
  date: Date | string,
  format: '12h' | '24h' = '12h',
  options?: { includeDate?: boolean }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();

  const timeStr = formatTime(`${hours}:${minutes}`, format);

  if (options?.includeDate) {
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${dateStr} at ${timeStr}`;
  }

  return timeStr;
}

/**
 * Parse 12h time string to 24h format for storage
 */
export function parseTo24h(time: string): string {
  // Already in 24h format
  if (!time.includes('AM') && !time.includes('PM')) {
    return time;
  }

  const isPM = time.includes('PM');
  const [timePart] = time.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);

  let hour24 = hours;
  if (isPM && hours !== 12) {
    hour24 = hours + 12;
  } else if (!isPM && hours === 12) {
    hour24 = 0;
  }

  return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
