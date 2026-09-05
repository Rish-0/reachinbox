// ============================================================================
// Email Job Status Enum
// ============================================================================
export enum EmailJobStatus {
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

// ============================================================================
// User Types
// ============================================================================
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  slackConnected: boolean;
  slackTeamName: string | null;
}

// ============================================================================
// Campaign Types
// ============================================================================
export interface CampaignCreateInput {
  sender: string;
  subject: string;
  body: string;
  recipients: string; // Raw CSV/text content
  startTime: string; // ISO 8601
  delayBetweenMs: number;
  hourlyLimit: number;
}

export interface CampaignResponse {
  id: string;
  sender: string;
  subject: string;
  body: string;
  startTime: string;
  delayBetweenMs: number;
  hourlyLimit: number;
  totalEmails: number;
  createdAt: string;
}

// ============================================================================
// Email Job Types
// ============================================================================
export interface EmailJobResponse {
  id: string;
  campaignId: string;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  status: EmailJobStatus;
  scheduledAt: string;
  sentAt: string | null;
  smtpMessageId: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
}

/** Payload stored in each BullMQ job */
export interface EmailJobData {
  emailJobId: string;
  campaignId: string;
  userId: string;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  scheduledAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  query: string;
}
