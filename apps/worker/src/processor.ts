import { Job, Queue } from 'bullmq';
import { EmailJobData, EmailJobStatus, ES_EMAIL_INDEX, generateJobId } from '@reachinbox/shared';
import { prisma } from './utils/prisma';
import { esClient } from './utils/elastic';
import { logger } from './utils/logger';
import { checkRateLimit, checkMinInterval, calculateNextWindowDelay } from './rateLimiter';
import { sendEmail } from './emailSender';
import { notifyRateLimitReached } from './slackNotifier';
import { workerEnv } from './config/env';

/**
 * Main job processor for the email-send queue.
 *
 * Processing flow:
 * 1. Look up EmailJob in DB
 * 2. Idempotency guard: skip if already SENT
 * 3. Transition to PROCESSING
 * 4. Check minimum send interval
 * 5. Check per-sender hourly rate limit
 * 6. Send email via SMTP
 * 7. Update DB to SENT + ES index
 *
 * On rate limit: reschedule (not fail/drop)
 * On SMTP failure: mark FAILED with error details
 *
 * NOTE: There is an unavoidable small crash window between SMTP acceptance
 * and DB status update. If the worker crashes in this window, the email
 * may have been sent by SMTP but DB still shows PROCESSING. On restart,
 * the job would be retried, potentially causing a duplicate send.
 * SMTP does not provide exactly-once delivery guarantees.
 * This is documented as a known trade-off.
 */
export async function processEmailJob(
  job: Job<EmailJobData>,
  emailQueue: Queue
): Promise<void> {
  const { emailJobId, userId, recipient, sender, subject, body } = job.data;

  logger.info({ emailJobId, recipient, sender, attempt: job.attemptsMade + 1 }, 'Processing email job');

  // Step 1: Look up EmailJob in DB
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: emailJobId },
  });

  if (!emailJob) {
    logger.warn({ emailJobId }, 'EmailJob not found in DB — skipping');
    return; // Don't retry, job is orphaned
  }

  // Step 2: Idempotency guard — skip if already SENT
  if (emailJob.status === EmailJobStatus.SENT) {
    logger.info({ emailJobId }, 'EmailJob already SENT — skipping (idempotency)');
    return;
  }

  // Step 3: Transition SCHEDULED → PROCESSING (atomic, safe for concurrent workers)
  const transitioned = await prisma.emailJob.updateMany({
    where: {
      id: emailJobId,
      status: { in: [EmailJobStatus.SCHEDULED, EmailJobStatus.FAILED] },
    },
    data: {
      status: EmailJobStatus.PROCESSING,
      attempts: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  if (transitioned.count === 0 && emailJob.status === EmailJobStatus.PROCESSING) {
    // Another worker is already processing this — skip
    logger.info({ emailJobId }, 'EmailJob already PROCESSING — skipping');
    return;
  }

  // Step 4: Check minimum send interval
  const intervalResult = await checkMinInterval(sender);
  if (!intervalResult.allowed) {
    logger.info(
      { emailJobId, sender, waitMs: intervalResult.waitMs },
      'Minimum send interval not met — rescheduling'
    );

    // Reschedule with the remaining wait time
    await rescheduleJob(emailQueue, job.data, intervalResult.waitMs, emailJobId);
    return;
  }

  // Step 5: Check per-sender hourly rate limit (Redis Lua atomic)
  const rateLimitResult = await checkRateLimit(sender);
  if (!rateLimitResult.allowed) {
    logger.info(
      {
        emailJobId,
        sender,
        currentCount: rateLimitResult.currentCount,
        ttlSeconds: rateLimitResult.ttlSeconds,
      },
      'Sender hourly rate limit reached — rescheduling'
    );

    // Calculate delay until next window
    const delay = calculateNextWindowDelay(rateLimitResult.ttlSeconds);

    // Reschedule the job
    await rescheduleJob(emailQueue, job.data, delay, emailJobId);

    // Send Slack notification (deduplicated)
    await notifyRateLimitReached(
      userId,
      sender,
      rateLimitResult.currentCount,
      workerEnv.MAX_EMAILS_PER_HOUR_PER_SENDER
    );

    return;
  }

  // Step 6: Send email via SMTP
  // ⚠️ CRASH WINDOW: If worker crashes after SMTP acceptance but before
  // the DB update below, the email may be sent but DB shows PROCESSING.
  try {
    const result = await sendEmail({
      from: sender,
      to: recipient,
      subject,
      html: body,
    });

    // Step 7: Update DB to SENT
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailJobStatus.SENT,
        sentAt: new Date(),
        smtpMessageId: result.messageId,
        updatedAt: new Date(),
      },
    });

    // Best-effort ES update
    try {
      await esClient.update({
        index: ES_EMAIL_INDEX,
        id: emailJobId,
        doc: {
          status: EmailJobStatus.SENT,
          sentAt: new Date().toISOString(),
        },
      });
    } catch {
      // ES failure must not affect the SENT status
    }

    logger.info(
      { emailJobId, recipient, messageId: result.messageId },
      'Email sent successfully'
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ emailJobId, recipient, error: errorMessage }, 'Email send failed');

    // Mark as FAILED in DB
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailJobStatus.FAILED,
        lastError: errorMessage,
        updatedAt: new Date(),
      },
    });

    // Update ES
    try {
      await esClient.update({
        index: ES_EMAIL_INDEX,
        id: emailJobId,
        doc: {
          status: EmailJobStatus.FAILED,
        },
      });
    } catch {
      // ES failure is non-fatal
    }

    // Re-throw to trigger BullMQ's built-in retry with backoff
    throw error;
  }
}

/**
 * Reschedule a job by adding a new delayed job and reverting DB status.
 * The original job completes normally (not failed) to avoid retry.
 */
async function rescheduleJob(
  queue: Queue,
  data: EmailJobData,
  delayMs: number,
  emailJobId: string
): Promise<void> {
  const newScheduledAt = new Date(Date.now() + delayMs);

  // Update DB with new scheduled time
  await prisma.emailJob.update({
    where: { id: emailJobId },
    data: {
      status: EmailJobStatus.SCHEDULED,
      scheduledAt: newScheduledAt,
      updatedAt: new Date(),
    },
  });

  // Add new BullMQ job with deterministic jobId
  // BullMQ allows adding a job with the same jobId if the previous one completed
  const jobId = generateJobId(emailJobId);

  try {
    await queue.add('send-email', { ...data, scheduledAt: newScheduledAt.toISOString() }, {
      delay: delayMs,
      jobId,
    });
  } catch (err) {
    // If jobId already exists and is still active, this is fine — it will be processed
    logger.warn({ emailJobId, err }, 'Reschedule enqueue warning (may be duplicate)');
  }

  logger.info(
    { emailJobId, delayMs, newScheduledAt: newScheduledAt.toISOString() },
    'Job rescheduled'
  );
}
