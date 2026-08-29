import { CoreApiError } from '@/lib/core-client';

export const inputClass = 'field-input';
export const labelClass = 'field-label';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof CoreApiError || error instanceof Error) return error.message || fallback;
  return fallback;
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, options ?? { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  if (Number.isNaN(elapsed)) return 'Unknown';
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function statusTone(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'complete':
    case 'succeeded':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/30 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-700/50';
    case 'failed':
    case 'error':
      return 'bg-red-50 text-red-800 ring-1 ring-red-600/30 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-700/50';
    case 'running':
      return 'bg-amber-50 text-amber-900 ring-1 ring-amber-500/30 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-600/40';
    case 'queued':
      return 'bg-blue-50 text-blue-800 ring-1 ring-blue-500/30 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-600/40';
    default:
      return 'bg-[#140D07]/5 text-[#4A3B2A] ring-1 ring-[#140D07]/15 dark:bg-white/10 dark:text-[#E2D5C3] dark:ring-white/20';
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
