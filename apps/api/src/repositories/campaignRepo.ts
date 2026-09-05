import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export const campaignRepo = {
  async create(data: any) {
    return prisma.campaign.create({ data });
  },

  async findByUserId(userId: string, page: number, limit: number) {
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where: { userId } }),
    ]);
    return { campaigns, total };
  },

  async findById(id: string) {
    return prisma.campaign.findUnique({ where: { id } });
  },
};
