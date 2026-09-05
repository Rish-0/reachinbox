import { Queue } from 'bullmq';
import { EMAIL_QUEUE_NAME } from '@reachinbox/shared';
import { redis } from '../utils/redis';

/**
 * BullMQ Queue instance for email sending.
 * Shared between the API (for enqueuing) and referenced by Bull Board.
 */
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 10000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});
