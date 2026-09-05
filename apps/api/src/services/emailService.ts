import { EmailJobStatus } from '@reachinbox/shared';
import { emailJobRepo } from '../repositories/emailJobRepo';

/**
 * Get scheduled emails (SCHEDULED + PROCESSING) for a user.
 */
export async function getScheduledEmails(
  userId: string,
  page: number,
  limit: number
) {
  return emailJobRepo.findByUserId(
    userId,
    [EmailJobStatus.SCHEDULED, EmailJobStatus.PROCESSING],
    page,
    limit
  );
}

/**
 * Get sent/failed emails for a user.
 */
export async function getSentEmails(
  userId: string,
  page: number,
  limit: number
) {
  return emailJobRepo.findByUserId(
    userId,
    [EmailJobStatus.SENT, EmailJobStatus.FAILED],
    page,
    limit
  );
}
