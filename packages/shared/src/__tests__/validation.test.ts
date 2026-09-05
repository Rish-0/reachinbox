import { describe, it, expect } from 'vitest';
import { createCampaignSchema, paginationSchema, searchSchema } from '../validation';

describe('createCampaignSchema', () => {
  const validInput = {
    sender: 'test@example.com',
    subject: 'Test Subject',
    body: 'Hello World',
    recipients: 'a@test.com,b@test.com',
    startTime: '2024-01-01T10:00:00Z',
    delayBetweenMs: 10000,
    hourlyLimit: 50,
  };

  it('should accept valid input', () => {
    const result = createCampaignSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid sender email', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      sender: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty subject', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      subject: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty recipients', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      recipients: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid start time', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      startTime: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative delay', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      delayBetweenMs: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero hourly limit', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      hourlyLimit: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should accept subject up to 500 chars', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      subject: 'x'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('should reject subject over 500 chars', () => {
    const result = createCampaignSchema.safeParse({
      ...validInput,
      subject: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('should use defaults for missing values', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should coerce string values', () => {
    const result = paginationSchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('should cap limit at 100', () => {
    const result = paginationSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});

describe('searchSchema', () => {
  it('should accept valid search input', () => {
    const result = searchSchema.safeParse({ q: 'hello' });
    expect(result.success).toBe(true);
  });

  it('should reject empty query', () => {
    const result = searchSchema.safeParse({ q: '' });
    expect(result.success).toBe(false);
  });

  it('should reject query over 200 chars', () => {
    const result = searchSchema.safeParse({ q: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});
