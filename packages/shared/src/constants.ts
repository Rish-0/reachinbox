// ============================================================================
// Queue & Redis Constants
// ============================================================================

/** BullMQ queue name for email sending */
export const EMAIL_QUEUE_NAME = 'email-send';

/** Redis key prefix for per-sender hourly rate limiting */
export const RATE_LIMIT_PREFIX = 'ratelimit';

/** Redis key prefix for minimum send interval tracking */
export const LAST_SEND_PREFIX = 'lastsend';

/** Redis key prefix for Slack notification deduplication */
export const SLACK_NOTIF_PREFIX = 'slack-notif';

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_WORKER_CONCURRENCY = 5;
export const DEFAULT_MIN_SEND_INTERVAL_MS = 1000;
export const DEFAULT_MAX_EMAILS_PER_HOUR_PER_SENDER = 50;

// ============================================================================
// Elasticsearch
// ============================================================================

export const ES_EMAIL_INDEX = 'emails';

// ============================================================================
// Pagination
// ============================================================================

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
