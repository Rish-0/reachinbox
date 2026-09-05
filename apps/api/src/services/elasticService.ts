import { esClient } from '../utils/elastic';
import { ES_EMAIL_INDEX } from '@reachinbox/shared';
import { EmailJob } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Index an email job in Elasticsearch.
 * Best-effort: failures are logged but never affect email delivery.
 */
export async function indexEmailJob(job: EmailJob): Promise<void> {
  try {
    await esClient.index({
      index: ES_EMAIL_INDEX,
      id: job.id,
      document: {
        userId: job.userId,
        campaignId: job.campaignId,
        recipient: job.recipient,
        sender: job.sender,
        subject: job.subject,
        body: job.body,
        status: job.status,
        scheduledAt: job.scheduledAt.toISOString(),
        sentAt: job.sentAt?.toISOString() || null,
      },
    });
  } catch (error) {
    logger.warn(
      { error, jobId: job.id },
      'Failed to index email job in Elasticsearch (non-fatal)'
    );
  }
}

/**
 * Update an email job's status in Elasticsearch.
 */
export async function updateEmailJobIndex(
  jobId: string,
  update: Record<string, unknown>
): Promise<void> {
  try {
    await esClient.update({
      index: ES_EMAIL_INDEX,
      id: jobId,
      doc: update,
    });
  } catch (error) {
    logger.warn(
      { error, jobId },
      'Failed to update email job in Elasticsearch (non-fatal)'
    );
  }
}

/**
 * Search emails in Elasticsearch with tenant isolation.
 */
export async function searchEmails(
  userId: string,
  query: string,
  page: number,
  limit: number
) {
  try {
    const result = await esClient.search({
      index: ES_EMAIL_INDEX,
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['recipient', 'subject', 'body', 'status', 'sender'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: [
            {
              term: { userId },
            },
          ],
        },
      },
      sort: [{ scheduledAt: { order: 'desc' } }],
    });

    const hits = result.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source as Record<string, unknown>,
      _score: hit._score,
    }));

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

    return { results: hits, total };
  } catch (error) {
    logger.error({ error, query }, 'Elasticsearch search failed');
    throw error;
  }
}
