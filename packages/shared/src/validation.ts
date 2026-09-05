import { z } from 'zod';

// ============================================================================
// Campaign Validation
// ============================================================================

export const createCampaignSchema = z.object({
  sender: z
    .string()
    .min(1, 'Sender email is required')
    .email('Sender must be a valid email address'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject must be 500 characters or less'),
  body: z
    .string()
    .min(1, 'Email body is required')
    .max(50000, 'Body must be 50,000 characters or less'),
  recipients: z
    .string()
    .min(1, 'Recipients are required'),
  startTime: z
    .string()
    .min(1, 'Start time is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Start time must be a valid ISO 8601 date'
    ),
  delayBetweenMs: z
    .number()
    .int()
    .min(0, 'Delay must be non-negative')
    .max(86400000, 'Delay must be at most 24 hours'),
  hourlyLimit: z
    .number()
    .int()
    .min(1, 'Hourly limit must be at least 1')
    .max(10000, 'Hourly limit must be at most 10,000'),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

// ============================================================================
// Pagination Validation
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================================
// Search Validation
// ============================================================================

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchInput = z.infer<typeof searchSchema>;
