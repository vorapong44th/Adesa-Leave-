import { workingDays } from '../../functions/core.js';
/**
 * Calculates number of business/working days between two dates (excluding Saturday and Sunday).
 */
export function calculateWorkingDays(startDateStr: string, endDateStr: string, isHalfDay = false): number {
  if (!startDateStr || !endDateStr) return 0;
  try { return workingDays(startDateStr, isHalfDay ? startDateStr : endDateStr, isHalfDay); }
  catch { return 0; }
}

/**
 * Formats a YYYY-MM-DD date string into a friendly localized display format.
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Checks if two date ranges overlap.
 */
export function doDateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && endA >= startB;
}

/**
 * Formats relative timestamp like "5m ago", "2h ago", "Yesterday".
 */
export function formatRelativeTime(isoStr: string): string {
  try {
    const past = new Date(isoStr).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'Recent';
  }
}
