import dotenv from 'dotenv';
import path from 'path';

try {
  dotenv.config();
} catch (_e) {
  // Ignored in container/production environments
}

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PORT: parseInt(process.env.PORT || process.env.API_PORT || '4000', 10),

  // Database
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://reachinbox:reachinbox_dev@localhost:5432/reachinbox?schema=public',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Elasticsearch
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',

  // Slack OAuth
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID || 'your-slack-client-id',
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || 'your-slack-client-secret',

  // Ethereal SMTP
  ETHEREAL_USER: process.env.ETHEREAL_USER || '',
  ETHEREAL_PASS: process.env.ETHEREAL_PASS || '',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret-key-reachinbox-monorepo-2026',

  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:4000',

  // Worker config
  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  MIN_SEND_INTERVAL_MS: parseInt(process.env.MIN_SEND_INTERVAL_MS || '1000', 10),
  MAX_EMAILS_PER_HOUR_PER_SENDER: parseInt(
    process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '50',
    10
  ),
} as const;
