import { Request, Response, NextFunction } from 'express';
import { createCampaign } from '../services/campaignService';
import { campaignRepo } from '../repositories/campaignRepo';

/**
 * POST /api/campaigns — Create a new email campaign
 */
export async function createCampaignHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createCampaign({
      userId: req.session.userId!,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/campaigns — List user's campaigns
 */
export async function listCampaigns(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { campaigns, total } = await campaignRepo.findByUserId(
      req.session.userId!,
      page,
      limit
    );

    res.json({
      success: true,
      data: campaigns.map((c: any) => ({
        ...c,
        startTime: c.startTime.toISOString(),
        createdAt: c.createdAt.toISOString(),
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
