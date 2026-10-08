/**
 * When something was published, the way a feed reader says it. Pure.
 *
 * Shared by podcast episodes and blog posts, so the two lists read alike.
 */

const DAY_MONTH = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: 'long' });

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** `Today`, `Yesterday`, a weekday within the week, then `3 Jun`, and `3 Jun 2024` for another year. */
export function formatPubDate(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.round((startOfLocalDay(now) - startOfLocalDay(date)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return WEEKDAY.format(date);
  return date.getFullYear() === now.getFullYear() ? DAY_MONTH.format(date) : DAY_MONTH_YEAR.format(date);
}
