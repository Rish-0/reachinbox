import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Quick DB check
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

export default router;
