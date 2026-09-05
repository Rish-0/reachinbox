import Redis from 'ioredis';
import { env } from '../config/env';

// Singleton Redis connection
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    // Retry with backoff, max 5 seconds
    return Math.min(times * 500, 5000);
  },
});

redis.on('error', (err) => {
  // Gracefully log Redis connection errors without crashing
  console.warn('⚠️  Redis connection warning:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});
