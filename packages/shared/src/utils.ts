// ============================================================================
// Email Parsing & Validation
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Parse emails from CSV or text input.
 * Handles comma, semicolon, newline, and space-separated formats.
 * Validates each email and deduplicates (case-insensitive).
 *
 * @returns Array of unique, valid, lowercased email addresses
 */
export function parseEmails(input: string): string[] {
  if (!input || !input.trim()) {
    return [];
  }

  // Split by common delimiters: comma, semicolon, newline, tab, pipe
  const rawEmails = input
    .split(/[,;\n\r\t|]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  // Validate and deduplicate
  const seen = new Set<string>();
  const validEmails: string[] = [];

  for (const email of rawEmails) {
    if (EMAIL_REGEX.test(email) && !seen.has(email)) {
      seen.add(email);
      validEmails.push(email);
    }
  }

  return validEmails;
}

// ============================================================================
// Scheduling
// ============================================================================

/**
 * Calculate the scheduled send time for an email at a given index.
 *
 * @param startTime - Campaign start time (ISO string or Date)
 * @param index - Zero-based index of the email in the sequence
 * @param delayBetweenMs - Milliseconds between consecutive emails
 * @returns Date object representing when this email should be sent
 */
export function calculateScheduledTime(
  startTime: Date | string,
  index: number,
  delayBetweenMs: number
): Date {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  return new Date(start.getTime() + index * delayBetweenMs);
}

/**
 * Calculate the BullMQ delay in milliseconds from now until the scheduled time.
 * Returns 0 if the scheduled time is in the past (job should be processed immediately).
 */
export function calculateDelay(scheduledAt: Date | string): number {
  const scheduled =
    typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;
  const delay = scheduled.getTime() - Date.now();
  return Math.max(0, delay);
}

// ============================================================================
// Deterministic Job IDs
// ============================================================================

/**
 * Generate a deterministic BullMQ jobId from the database EmailJob ID.
 * This prevents duplicate jobs across API/worker restarts.
 */
export function generateJobId(emailJobId: string): string {
  return `email-job-${emailJobId}`;
}

// ============================================================================
// Rate Limit Helpers
// ============================================================================

/**
 * Get the rate limit Redis key for a sender in the current hour window.
 * Window is based on UTC hour boundary.
 */
export function getRateLimitKey(sender: string, prefix: string): string {
  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
  return `${prefix}:${sender}:${hourWindow}`;
}

/**
 * Get the Slack notification dedup key.
 */
export function getSlackNotifKey(
  userId: string,
  sender: string,
  prefix: string
): string {
  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
  return `${prefix}:${userId}:${sender}:${hourWindow}`;
}
