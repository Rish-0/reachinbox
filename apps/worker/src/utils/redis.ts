import Redis from 'ioredis';
import { workerEnv } from '../config/env';

export const redis = new Redis(workerEnv.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 500, 5000);
  },
});

redis.on('error', (err) => {
  console.warn('⚠️  Worker Redis warning:', err.message);
});
