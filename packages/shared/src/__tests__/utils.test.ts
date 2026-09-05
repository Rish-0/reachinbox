import { describe, it, expect } from 'vitest';
import { parseEmails, calculateScheduledTime, calculateDelay, generateJobId, getRateLimitKey } from '../utils';

describe('parseEmails', () => {
  it('should parse comma-separated emails', () => {
    const result = parseEmails('a@test.com, b@test.com, c@test.com');
    expect(result).toEqual(['a@test.com', 'b@test.com', 'c@test.com']);
  });

  it('should parse newline-separated emails', () => {
    const result = parseEmails('a@test.com\nb@test.com\nc@test.com');
    expect(result).toEqual(['a@test.com', 'b@test.com', 'c@test.com']);
  });

  it('should parse semicolon-separated emails', () => {
    const result = parseEmails('a@test.com;b@test.com;c@test.com');
    expect(result).toEqual(['a@test.com', 'b@test.com', 'c@test.com']);
  });

  it('should deduplicate emails (case-insensitive)', () => {
    const result = parseEmails('A@Test.com, a@test.com, a@TEST.COM');
    expect(result).toEqual(['a@test.com']);
  });

  it('should filter invalid emails', () => {
    const result = parseEmails('valid@test.com, invalid, @broken.com, test@, ok@example.org');
    expect(result).toEqual(['valid@test.com', 'ok@example.org']);
  });

  it('should handle empty input', () => {
    expect(parseEmails('')).toEqual([]);
    expect(parseEmails('   ')).toEqual([]);
  });

  it('should handle CSV with headers and mixed content', () => {
    const csv = 'name@company.com\njohn@doe.com\ninvalid-email\njane@example.com';
    const result = parseEmails(csv);
    expect(result).toEqual(['name@company.com', 'john@doe.com', 'jane@example.com']);
  });

  it('should handle pipe-separated emails', () => {
    const result = parseEmails('a@test.com|b@test.com');
    expect(result).toEqual(['a@test.com', 'b@test.com']);
  });

  it('should handle tab-separated emails', () => {
    const result = parseEmails('a@test.com\tb@test.com');
    expect(result).toEqual(['a@test.com', 'b@test.com']);
  });

  it('should handle large lists efficiently', () => {
    const emails = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
    const result = parseEmails(emails.join(','));
    expect(result).toHaveLength(1000);
  });
});

describe('calculateScheduledTime', () => {
  it('should calculate correct scheduled times', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    
    expect(calculateScheduledTime(start, 0, 10000)).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(calculateScheduledTime(start, 1, 10000)).toEqual(new Date('2024-01-01T10:00:10Z'));
    expect(calculateScheduledTime(start, 5, 10000)).toEqual(new Date('2024-01-01T10:00:50Z'));
  });

  it('should handle ISO string input', () => {
    const result = calculateScheduledTime('2024-01-01T10:00:00Z', 3, 60000);
    expect(result).toEqual(new Date('2024-01-01T10:03:00Z'));
  });

  it('should handle zero delay', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    const result = calculateScheduledTime(start, 10, 0);
    expect(result).toEqual(start);
  });

  it('should handle large index values (1000+ emails)', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const result = calculateScheduledTime(start, 999, 1000); // 999 seconds
    expect(result).toEqual(new Date('2024-01-01T00:16:39Z'));
  });
});

describe('calculateDelay', () => {
  it('should return 0 for past dates', () => {
    const past = new Date(Date.now() - 60000);
    expect(calculateDelay(past)).toBe(0);
  });

  it('should return positive delay for future dates', () => {
    const future = new Date(Date.now() + 60000);
    const delay = calculateDelay(future);
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(60000);
  });
});

describe('generateJobId', () => {
  it('should generate deterministic job ID', () => {
    expect(generateJobId('abc-123')).toBe('email-job-abc-123');
    expect(generateJobId('abc-123')).toBe(generateJobId('abc-123'));
  });

  it('should generate unique IDs for different inputs', () => {
    expect(generateJobId('a')).not.toBe(generateJobId('b'));
  });
});

describe('getRateLimitKey', () => {
  it('should include sender and hour window', () => {
    const key = getRateLimitKey('test@example.com', 'ratelimit');
    expect(key).toContain('ratelimit');
    expect(key).toContain('test@example.com');
    // Should contain date components
    expect(key).toMatch(/ratelimit:test@example\.com:\d{4}-\d{2}-\d{2}-\d{2}/);
  });
});
