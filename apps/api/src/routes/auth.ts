import { Router } from 'express';
import {
  googleAuth,
  googleCallback,
  logout,
  slackAuth,
  slackCallback,
  slackDisconnect,
  getMe,
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Logout
router.post('/logout', logout);

// Slack OAuth (requires authentication)
router.get('/slack', requireAuth, slackAuth);
router.get('/slack/callback', slackCallback);
router.post('/slack/disconnect', requireAuth, slackDisconnect);

export default router;
