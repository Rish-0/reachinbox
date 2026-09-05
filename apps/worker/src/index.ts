import { Worker, Queue } from 'bullmq';
import http from 'http';
import { EMAIL_QUEUE_NAME } from '@reachinbox/shared';
import { workerEnv } from './config/env';
import { redis } from './utils/redis';
import { logger } from './utils/logger';
import { processEmailJob } from './processor';
import { verifySmtp } from './emailSender';

async function main() {
  logger.info('Starting ReachInbox Worker...');

  // Verify SMTP connection
  await verifySmtp();

  // Create a Queue reference (for rescheduling)
  const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: redis,
  });

  // Create the BullMQ Worker
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      await processEmailJob(job, emailQueue);
    },
    {
      connection: redis,
      concurrency: workerEnv.WORKER_CONCURRENCY,
      // Don't remove completed jobs immediately — let Bull Board show them
      removeOnComplete: { age: 24 * 3600, count: 10000 },
      removeOnFail: { age: 7 * 24 * 3600 },
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, name: job?.name, error: err.message },
      'Job failed'
    );
  });

  worker.on('error', (err) => {
    if (!err.message?.includes('ECONNREFUSED')) {
      logger.error({ error: err.message }, 'Worker error');
    }
  });

  // Health check HTTP server
  const healthServer = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        worker: 'running',
        concurrency: workerEnv.WORKER_CONCURRENCY,
        timestamp: new Date().toISOString(),
      })
    );
  });

  healthServer.listen(workerEnv.WORKER_HEALTH_PORT, () => {
    logger.info(
      `🏭 Worker running with concurrency=${workerEnv.WORKER_CONCURRENCY}`
    );
    logger.info(
      `❤️  Worker health: http://localhost:${workerEnv.WORKER_HEALTH_PORT}`
    );
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down worker...');
    await worker.close();
    await emailQueue.close();
    healthServer.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start worker');
  process.exit(1);
});
