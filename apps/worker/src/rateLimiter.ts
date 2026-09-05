import { redis } from './utils/redis';
import { getRateLimitKey, RATE_LIMIT_PREFIX, LAST_SEND_PREFIX } from '@reachinbox/shared';
import { workerEnv } from './config/env';
import { logger } from './utils/logger';

// ============================================================================
// Lua Script: Atomic Rate Limit Check & Reserve
// ============================================================================
//
// This Lua script runs atomically in Redis:
// 1. Checks if current count < max allowed
// 2. If yes: increments and returns [1, newCount, ttl]
// 3. If no: returns [0, currentCount, ttl]
//
// The key auto-expires after 3600 seconds (1 hour window).
// ============================================================================

const RATE_LIMIT_LUA = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local current = tonumber(redis.call('GET', key) or '0')

if current >= max then
  local ttl = redis.call('TTL', key)
  if ttl < 0 then ttl = 3600 end
  return {0, current, ttl}
end

local newCount = redis.call('INCR', key)
if newCount == 1 then
  redis.call('EXPIRE', key, 3600)
end
return {1, newCount, redis.call('TTL', key)}
`;

// ============================================================================
// Lua Script: Minimum Send Interval Enforcement
// ============================================================================

const MIN_INTERVAL_LUA = `
local key = KEYS[1]
local minInterval = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local lastSend = tonumber(redis.call('GET', key) or '0')
local elapsed = now - lastSend

if elapsed < minInterval then
  return {0, minInterval - elapsed}
end

redis.call('SET', key, now)
redis.call('EXPIRE', key, 60)
return {1, 0}
`;

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  ttlSeconds: number;
}

export interface IntervalResult {
  allowed: boolean;
  waitMs: number;
}

/**
 * Check and reserve a rate limit slot for a sender.
 * Uses Redis Lua for atomic check-and-increment across multiple workers.
 */
export async function checkRateLimit(sender: string): Promise<RateLimitResult> {
  const key = getRateLimitKey(sender, RATE_LIMIT_PREFIX);
  const maxPerHour = workerEnv.MAX_EMAILS_PER_HOUR_PER_SENDER;

  const result = (await redis.eval(RATE_LIMIT_LUA, 1, key, maxPerHour)) as number[];

  return {
    allowed: result[0] === 1,
    currentCount: result[1],
    ttlSeconds: result[2],
  };
}

/**
 * Check minimum send interval between emails from the same sender.
 * Prevents burst sending even within rate limits.
 */
export async function checkMinInterval(sender: string): Promise<IntervalResult> {
  const key = `${LAST_SEND_PREFIX}:${sender}`;
  const now = Date.now();
  const minInterval = workerEnv.MIN_SEND_INTERVAL_MS;

  const result = (await redis.eval(
    MIN_INTERVAL_LUA,
    1,
    key,
    minInterval,
    now
  )) as number[];

  return {
    allowed: result[0] === 1,
    waitMs: result[1],
  };
}

/**
 * Calculate the delay in milliseconds until the next available sending window.
 * Used to reschedule jobs when rate limit is hit.
 */
export function calculateNextWindowDelay(ttlSeconds: number): number {
  // Add a small random jitter (0-5s) to avoid thundering herd
  const jitter = Math.floor(Math.random() * 5000);
  return (ttlSeconds * 1000) + jitter;
}
