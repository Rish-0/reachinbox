import { WebClient } from '@slack/web-api';
import { redis } from './utils/redis';
import { getSlackNotifKey, SLACK_NOTIF_PREFIX } from '@reachinbox/shared';
import { prisma } from './utils/prisma';
import { logger } from './utils/logger';

/**
 * Send a Slack notification when a sender's hourly rate limit is reached.
 *
 * Deduplication: Only one notification per user+sender+hour window.
 * Graceful: If Slack is disconnected, processing continues normally.
 */
export async function notifyRateLimitReached(
  userId: string,
  sender: string,
  currentCount: number,
  maxPerHour: number
): Promise<void> {
  try {
    // Check dedup key first
    const dedupKey = getSlackNotifKey(userId, sender, SLACK_NOTIF_PREFIX);
    const alreadyNotified = await redis.get(dedupKey);
    if (alreadyNotified) {
      logger.debug({ userId, sender }, 'Slack notification already sent for this window');
      return;
    }

    // Get user's Slack token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        slackAccessToken: true,
        slackUserId: true,
        name: true,
      },
    });

    if (!user?.slackAccessToken) {
      logger.debug({ userId }, 'Slack not connected — skipping notification');
      return;
    }

    // Send real Slack API message
    const slackClient = new WebClient(user.slackAccessToken);

    // DM the user who connected Slack
    await slackClient.chat.postMessage({
      channel: user.slackUserId || userId,
      text: `⚠️ *Rate Limit Reached*\n\nSender \`${sender}\` has reached the hourly email limit (${currentCount}/${maxPerHour}).\n\nEmails are being automatically rescheduled to the next available window. No emails will be dropped.`,
      mrkdwn: true,
    });

    // Set dedup key with 1 hour TTL
    await redis.set(dedupKey, '1', 'EX', 3600);

    logger.info({ userId, sender }, 'Slack rate limit notification sent');
  } catch (error) {
    // Slack failures must never affect email processing
    logger.warn(
      { error, userId, sender },
      'Failed to send Slack notification (non-fatal)'
    );
  }
}
