import { Client } from '@elastic/elasticsearch';
import { env } from '../config/env';
import { ES_EMAIL_INDEX } from '@reachinbox/shared';

export const esClient = new Client({
  node: env.ELASTICSEARCH_URL,
});

/**
 * Initialize Elasticsearch index with proper mappings.
 * Safe to call multiple times — uses if_not_exists semantics.
 */
export async function initElasticsearch(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: ES_EMAIL_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: ES_EMAIL_INDEX,
        body: {
          mappings: {
            properties: {
              userId: { type: 'keyword' },
              campaignId: { type: 'keyword' },
              recipient: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              sender: { type: 'keyword' },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
            },
          },
        },
      });
      console.log('✅ Elasticsearch index created:', ES_EMAIL_INDEX);
    } else {
      console.log('✅ Elasticsearch index exists:', ES_EMAIL_INDEX);
    }
  } catch (error) {
    console.warn(
      '⚠️  Elasticsearch initialization failed (non-fatal):',
      error instanceof Error ? error.message : error
    );
  }
}
