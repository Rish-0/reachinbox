import {
  parseEmails,
  calculateScheduledTime,
  calculateDelay,
  generateJobId,
  EmailJobData,
} from '@reachinbox/shared';
import { prisma } from '../utils/prisma';
import { emailQueue } from '../queues/emailQueue';
import { logger } from '../utils/logger';
import { indexEmailJob } from './elasticService';
import { AppError } from '../middleware/errorHandler';

interface CreateCampaignParams {
  userId: string;
  sender: string;
  subject: string;
  body: string;
  recipients: string;
  startTime: string;
  delayBetweenMs: number;
  hourlyLimit: number;
}

/**
 * Create a campaign: parse emails, persist to DB, then enqueue BullMQ jobs.
 *
 * Critical ordering:
 * 1. Validate & parse
 * 2. DB transaction (Campaign + EmailJobs) — source of truth
 * 3. BullMQ enqueue — best-effort, reconcilable
 * 4. Elasticsearch index — best-effort, non-blocking
 */
export async function createCampaign(params: CreateCampaignParams) {
  const { userId, sender, subject, body, recipients, startTime, delayBetweenMs, hourlyLimit } = params;

  // Step 1: Parse and deduplicate emails
  const validEmails = parseEmails(recipients);
  if (validEmails.length === 0) {
    throw new AppError('No valid email addresses found in recipients', 400);
  }

  // Step 2: DB Transaction — create campaign + all email jobs atomically
  const { campaign, emailJobs } = await prisma.$transaction(async (tx: any) => {
    const campaign = await tx.campaign.create({
      data: {
        userId,
        sender,
        subject,
        body,
        startTime: new Date(startTime),
        delayBetweenMs,
        hourlyLimit,
        totalEmails: validEmails.length,
      },
    });

    const emailJobData = validEmails.map((recipient, index) => ({
      campaignId: campaign.id,
      userId,
      recipient,
      sender,
      subject,
      body,
      scheduledAt: calculateScheduledTime(startTime, index, delayBetweenMs),
    }));

    await tx.emailJob.createMany({
      data: emailJobData,
      skipDuplicates: true,
    });

    const emailJobs = await tx.emailJob.findMany({
      where: { campaignId: campaign.id },
      orderBy: { scheduledAt: 'asc' },
    });

    return { campaign, emailJobs };
  });

  // Step 3: Enqueue BullMQ delayed jobs (after DB commit)
  const enqueueResults = await Promise.allSettled(
    emailJobs.map((job: any) => {
      const jobData: EmailJobData = {
        emailJobId: job.id,
        campaignId: job.campaignId,
        userId: job.userId,
        recipient: job.recipient,
        sender: job.sender,
        subject: job.subject,
        body: job.body,
        scheduledAt: job.scheduledAt.toISOString(),
      };

      const delay = calculateDelay(job.scheduledAt);
      const jobId = generateJobId(job.id);

      return emailQueue.add('send-email', jobData, {
        delay,
        jobId,
      });
    })
  );

  // Log any enqueue failures (reconciliation will pick them up)
  const failures = enqueueResults.filter((r: any) => r.status === 'rejected');
  if (failures.length > 0) {
    logger.warn(
      { failures: failures.length, total: emailJobs.length },
      'Some jobs failed to enqueue — reconciliation will recover them'
    );
  }

  // Step 4: Best-effort Elasticsearch indexing (non-blocking)
  for (const job of emailJobs) {
    indexEmailJob(job).catch((err) =>
      logger.warn({ err, jobId: job.id }, 'ES indexing failed (non-fatal)')
    );
  }

  return {
    campaign: {
      ...campaign,
      startTime: campaign.startTime.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
    },
    emailCount: emailJobs.length,
    enqueuedCount: emailJobs.length - failures.length,
  };
}

/**
 * Startup reconciliation: re-enqueue any SCHEDULED jobs that might have
 * been persisted to DB but not enqueued to BullMQ (crash recovery).
 *
 * Safe to call multiple times due to deterministic jobId.
 */
export async function reconcileScheduledJobs() {
  try {
    const scheduledJobs = await prisma.emailJob.findMany({
      where: { status: 'SCHEDULED' },
      orderBy: { scheduledAt: 'asc' },
    });

    if (scheduledJobs.length === 0) {
      logger.info('No scheduled jobs to reconcile');
      return;
    }

    logger.info({ count: scheduledJobs.length }, 'Reconciling scheduled jobs');

    let reconciled = 0;
    for (const job of scheduledJobs) {
      try {
        const jobData: EmailJobData = {
          emailJobId: job.id,
          campaignId: job.campaignId,
          userId: job.userId,
          recipient: job.recipient,
          sender: job.sender,
          subject: job.subject,
          body: job.body,
          scheduledAt: job.scheduledAt.toISOString(),
        };

        const delay = calculateDelay(job.scheduledAt);
        const jobId = generateJobId(job.id);

        // BullMQ will silently skip if jobId already exists
        await emailQueue.add('send-email', jobData, {
          delay,
          jobId,
        });
        reconciled++;
      } catch (err) {
        logger.warn({ err, jobId: job.id }, 'Failed to reconcile job');
      }
    }

    logger.info({ reconciled, total: scheduledJobs.length }, 'Reconciliation complete');
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : err },
      'Reconciliation skipped — Database or Redis not reachable'
    );
  }
}
