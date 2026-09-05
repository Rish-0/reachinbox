import { Request, Response, NextFunction } from 'express';
import { getScheduledEmails, getSentEmails } from '../services/emailService';
import { searchEmails } from '../services/elasticService';

/**
 * GET /api/emails/scheduled — Get scheduled/processing emails
 */
export async function scheduledEmailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { jobs, total } = await getScheduledEmails(
      req.session.userId!,
      page,
      limit
    );

    res.json({
      success: true,
      data: jobs.map((j: any) => ({
        ...j,
        scheduledAt: j.scheduledAt.toISOString(),
        sentAt: j.sentAt?.toISOString() || null,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/emails/sent — Get sent/failed emails
 */
export async function sentEmailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { jobs, total } = await getSentEmails(
      req.session.userId!,
      page,
      limit
    );

    res.json({
      success: true,
      data: jobs.map((j: any) => ({
        ...j,
        scheduledAt: j.scheduledAt.toISOString(),
        sentAt: j.sentAt?.toISOString() || null,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/emails/search?q=... — Search emails via Elasticsearch
 */
export async function searchEmailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Search query (q) is required',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { results, total } = await searchEmails(
      req.session.userId!,
      q.trim(),
      page,
      limit
    );

    res.json({
      success: true,
      data: results,
      total,
      query: q,
    });
  } catch (error) {
    // Graceful ES failure — return empty results instead of 500
    res.json({
      success: true,
      data: [],
      total: 0,
      query: req.query.q,
      warning: 'Search service temporarily unavailable',
    });
  }
}
