/**
 * Format an ISO date string to user's local timezone.
 */
export function formatDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 5 minutes")
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);

  const minutes = Math.floor(absDiffMs / 60000);
  const hours = Math.floor(absDiffMs / 3600000);
  const days = Math.floor(absDiffMs / 86400000);

  const isFuture = diffMs > 0;

  if (minutes < 1) return 'just now';
  if (minutes < 60)
    return isFuture ? `in ${minutes}m` : `${minutes}m ago`;
  if (hours < 24)
    return isFuture ? `in ${hours}h` : `${hours}h ago`;
  return isFuture ? `in ${days}d` : `${days}d ago`;
}

/**
 * Get status badge class name
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'badge-scheduled';
    case 'PROCESSING':
      return 'badge-processing';
    case 'SENT':
      return 'badge-sent';
    case 'FAILED':
      return 'badge-failed';
    default:
      return 'badge bg-surface-100 text-surface-600';
  }
}
