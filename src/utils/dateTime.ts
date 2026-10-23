/**
 * Date & Time Utilities for Rahel Stationary POS
 * Ensures accurate local calendar dates and wall-clock times across all timezones.
 */

/**
 * Returns YYYY-MM-DD for the given date in local time (defaults to now).
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns HH:mm for the given date in local time (defaults to now).
 */
export function getLocalTimeString(d: Date = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Resolves an accurate, timezone-aware ISO string for storing in database records.
 * 
 * Prevents the classic JavaScript bug where date-only strings ("YYYY-MM-DD")
 * are parsed by `new Date()` as UTC midnight (00:00:00.000Z), which wipes the actual
 * time of the sale and shifts the displayed date into yesterday in western timezones
 * or 3:00 AM in East Africa Time (UTC+3).
 */
export function resolveAccurateTimestamp(inputDate?: string, inputTime?: string): string {
  const now = new Date();

  if (!inputDate || inputDate.trim() === '') {
    return now.toISOString();
  }

  const trimmedDate = inputDate.trim();

  // If input is already a combined ISO or datetime-local (e.g. "2026-10-23T14:30" or "2026-10-23T14:30:00")
  if (trimmedDate.includes('T')) {
    const [datePart, timePart] = trimmedDate.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    
    // Clean any Z or millis
    const cleanTime = timePart.replace('Z', '').split('.')[0];
    const timeParts = cleanTime.split(':').map(Number);
    const h = timeParts[0] ?? now.getHours();
    const min = timeParts[1] ?? now.getMinutes();
    const s = timeParts[2] ?? now.getSeconds();

    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const localDate = new Date(y, m - 1, d, h, min, s);
      if (!isNaN(localDate.getTime())) {
        return localDate.toISOString();
      }
    }
  }

  // If input is YYYY-MM-DD
  const dateMatch = trimmedDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dateMatch) {
    const y = parseInt(dateMatch[1], 10);
    const m = parseInt(dateMatch[2], 10) - 1;
    const d = parseInt(dateMatch[3], 10);

    let h = now.getHours();
    let min = now.getMinutes();
    let s = now.getSeconds();

    if (inputTime && inputTime.trim()) {
      const timeMatch = inputTime.trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
      if (timeMatch) {
        h = parseInt(timeMatch[1], 10);
        min = parseInt(timeMatch[2], 10);
        s = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      }
    }

    const localDate = new Date(y, m, d, h, min, s);
    if (!isNaN(localDate.getTime())) {
      return localDate.toISOString();
    }
  }

  // Generic fallback: parse and ensure valid
  const fallback = new Date(trimmedDate);
  return isNaN(fallback.getTime()) ? now.toISOString() : fallback.toISOString();
}

/**
 * Formats a timestamp into human-readable Date & Time (e.g. "Oct 23, 2026, 1:45 PM")
 */
export function formatLocalDateTime(timestamp: string | Date | undefined): string {
  if (!timestamp) return '—';
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a timestamp into short date (e.g. "Oct 23, 2026")
 */
export function formatLocalDate(timestamp: string | Date | undefined): string {
  if (!timestamp) return '—';
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a timestamp into short time (e.g. "1:45 PM" or "1:45:20 PM")
 */
export function formatLocalTime(timestamp: string | Date | undefined, includeSeconds = false): string {
  if (!timestamp) return '—';
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/**
 * Checks if two timestamps fall on the exact same local calendar day.
 */
export function isSameLocalDate(a: string | Date, b: string | Date = new Date()): boolean {
  const dateA = typeof a === 'string' ? new Date(a) : a;
  const dateB = typeof b === 'string' ? new Date(b) : b;
  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return false;

  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
