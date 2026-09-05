import dotenv from 'dotenv';
import path from 'path';

try {
  dotenv.config();
} catch (_e) {
  // Ignored in container/production environments
}

export const workerEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://reachinbox:reachinbox_dev@localhost:5432/reachinbox?schema=public',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

  ETHEREAL_USER: process.env.ETHEREAL_USER || '',
  ETHEREAL_PASS: process.env.ETHEREAL_PASS || '',

  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  MIN_SEND_INTERVAL_MS: parseInt(process.env.MIN_SEND_INTERVAL_MS || '1000', 10),
  MAX_EMAILS_PER_HOUR_PER_SENDER: parseInt(
    process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '50',
    10
  ),

  WORKER_HEALTH_PORT: parseInt(process.env.WORKER_HEALTH_PORT || '4001', 10),
} as const;
