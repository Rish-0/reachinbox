import nodemailer from 'nodemailer';
import { workerEnv } from './config/env';
import { logger } from './utils/logger';

// Create Ethereal SMTP transporter
let transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: workerEnv.ETHEREAL_USER,
    pass: workerEnv.ETHEREAL_PASS,
  },
});

export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
}

/**
 * Send an email via Ethereal SMTP.
 * Returns the SMTP messageId and Ethereal preview URL.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const info = await transporter.sendMail({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  logger.info(
    {
      messageId: info.messageId,
      to: params.to,
      previewUrl,
    },
    'Email sent via Ethereal'
  );

  return {
    messageId: info.messageId,
    previewUrl,
  };
}

/**
 * Verify SMTP connection on startup. Auto-generates Ethereal credentials if needed.
 */
export async function verifySmtp(): Promise<boolean> {
  try {
    if (!workerEnv.ETHEREAL_USER || workerEnv.ETHEREAL_USER.includes('demo@ethereal.email')) {
      throw new Error('Placeholder credentials — generating live Ethereal account');
    }
    await transporter.verify();
    logger.info('✅ SMTP connection verified (Ethereal)');
    return true;
  } catch (error) {
    try {
      logger.info('🔄 Auto-generating live Ethereal SMTP test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      await transporter.verify();
      logger.info({ user: testAccount.user }, '✅ Auto-created working Ethereal SMTP test account');
      return true;
    } catch (err) {
      logger.warn({ err }, '⚠️  SMTP verification failed — emails will fail');
      return false;
    }
  }
}
