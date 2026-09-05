import app from './app';
import { env } from './config/env';
import { initElasticsearch } from './utils/elastic';
import { reconcileScheduledJobs } from './services/campaignService';
import { logger } from './utils/logger';

async function main() {
  // Initialize Elasticsearch index
  await initElasticsearch();

  // Startup reconciliation: re-enqueue any DB-persisted but un-enqueued jobs
  await reconcileScheduledJobs();

  // Start HTTP server
  app.listen(env.API_PORT, () => {
    logger.info(`🚀 API server running on http://localhost:${env.API_PORT}`);
    logger.info(`📊 Bull Board: http://localhost:${env.API_PORT}/admin/queues`);
    logger.info(`❤️  Health: http://localhost:${env.API_PORT}/health`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start API server');
  process.exit(1);
});
