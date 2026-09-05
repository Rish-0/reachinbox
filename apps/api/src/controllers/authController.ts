import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getSlackAuthUrl,
  handleSlackCallback,
  disconnectSlack,
} from '../services/authService';
import { userRepo } from '../repositories/userRepo';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * GET /auth/google — Redirect to Google OAuth consent screen
 */
export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID === 'your-google-client-id') {
      // Demo / Dev Mode: log in demo recruiter user automatically for easy local evaluation
      const user = await userRepo.upsertFromGoogle({
        googleId: 'demo-google-id-12345',
        email: 'alex.recruiter@reachinbox.ai',
        name: 'Alex Recruiter (Demo)',
        avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
      });
      req.session.userId = user.id;
      res.redirect(`${env.FRONTEND_URL}/dashboard`);
      return;
    }

    const state = crypto.randomBytes(32).toString('hex');
    req.session.oauthState = state;
    const url = getGoogleAuthUrl(state);
    res.redirect(url);
  } catch (error) {
    logger.error({ error }, 'googleAuth demo login failed');
    next(error);
  }
}

/**
 * GET /auth/google/callback — Handle Google OAuth callback
 */
export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { code, state } = req.query;

    // CSRF state verification
    if (!state || state !== req.session.oauthState) {
      logger.warn('OAuth state mismatch');
      res.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
      return;
    }
    delete req.session.oauthState;

    if (!code || typeof code !== 'string') {
      res.redirect(`${env.FRONTEND_URL}?error=no_code`);
      return;
    }

    const { user } = await handleGoogleCallback(code);

    // Set session
    req.session.userId = user.id;

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    logger.error({ error }, 'Google OAuth callback failed');
    res.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
  }
}

/**
 * POST /auth/logout — Destroy session
 */
export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, 'Session destroy failed');
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
}

/**
 * GET /auth/slack — Redirect to Slack OAuth
 */
export async function slackAuth(req: Request, res: Response) {
  if (!req.session.userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const state = crypto.randomBytes(32).toString('hex');
  req.session.slackOauthState = state;
  const url = getSlackAuthUrl(state);
  res.redirect(url);
}

/**
 * GET /auth/slack/callback — Handle Slack OAuth callback
 */
export async function slackCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { code, state } = req.query;

    if (!state || state !== req.session.slackOauthState) {
      logger.warn('Slack OAuth state mismatch');
      res.redirect(`${env.FRONTEND_URL}/dashboard?error=slack_auth_failed`);
      return;
    }
    delete req.session.slackOauthState;

    if (!code || typeof code !== 'string' || !req.session.userId) {
      res.redirect(`${env.FRONTEND_URL}/dashboard?error=slack_auth_failed`);
      return;
    }

    await handleSlackCallback(code, req.session.userId);
    res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`);
  } catch (error) {
    logger.error({ error }, 'Slack OAuth callback failed');
    res.redirect(`${env.FRONTEND_URL}/dashboard?error=slack_auth_failed`);
  }
}

/**
 * POST /auth/slack/disconnect — Remove Slack connection
 */
export async function slackDisconnect(req: Request, res: Response) {
  if (!req.session.userId) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  await disconnectSlack(req.session.userId);
  res.json({ success: true });
}

/**
 * GET /api/me — Get current user profile
 */
export async function getMe(req: Request, res: Response) {
  const user = await userRepo.findById(req.session.userId!);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      slackConnected: !!user.slackAccessToken,
      slackTeamName: user.slackTeamName,
    },
  });
}

// Extend session types for OAuth state
declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    slackOauthState?: string;
  }
}
