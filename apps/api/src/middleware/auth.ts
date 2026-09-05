import { Request, Response, NextFunction } from 'express';

// Extend Express session with user data
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    googleAccessToken?: string;
  }
}

/**
 * Authentication middleware.
 * Checks for a valid session with userId.
 * Returns 401 if not authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
    return;
  }
  next();
}
