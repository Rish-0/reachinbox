import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { env } from './config/env';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { getMe } from './controllers/authController';

import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaign';
import emailRoutes from './routes/email';
import healthRoutes from './routes/health';

import { emailQueue } from './queues/emailQueue';

const app = express();

// ============================================================================
// Global Middleware
// ============================================================================

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ============================================================================
// Session (PostgreSQL or MemoryStore for SQLite)
// ============================================================================
const isPg =
  env.DATABASE_URL.startsWith('postgres:') ||
  env.DATABASE_URL.startsWith('postgresql:');

const sessionStore = isPg
  ? new (connectPgSimple(session))({
      conString: env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    })
  : new session.MemoryStore();

app.use(
  session({
    store: sessionStore,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
    name: 'connect.sid',
  })
);

// ============================================================================
// Bull Board (protected)
// ============================================================================
const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter: bullBoardAdapter,
});

// Protect Bull Board with auth middleware
app.use('/admin/queues', requireAuth, bullBoardAdapter.getRouter());

// ============================================================================
// Routes
// ============================================================================

// Auth routes
app.use('/auth', authRoutes);

// Health check
app.use('/health', healthRoutes);

// Protected API routes
app.get('/api/me', requireAuth, getMe);
app.use('/api/campaigns', requireAuth, campaignRoutes);
app.use('/api/emails', requireAuth, emailRoutes);

// ============================================================================
// Error Handling
// ============================================================================
app.use(errorHandler);

export default app;
