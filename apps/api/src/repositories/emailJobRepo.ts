import { prisma } from '../utils/prisma';
import { EmailJobStatus } from '@reachinbox/shared';

export const emailJobRepo = {
  async createMany(data: any[]) {
    return prisma.emailJob.createMany({ data });
  },

  async findById(id: string) {
    return prisma.emailJob.findUnique({ where: { id } });
  },

  async findByUserId(
    userId: string,
    statuses: EmailJobStatus[],
    page: number,
    limit: number
  ) {
    const where = { userId, status: { in: statuses } };
    const [jobs, total] = await Promise.all([
      prisma.emailJob.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailJob.count({ where }),
    ]);
    return { jobs, total };
  },

  async updateStatus(
    id: string,
    status: EmailJobStatus,
    extra?: {
      sentAt?: Date;
      smtpMessageId?: string;
      lastError?: string;
      attempts?: number;
      scheduledAt?: Date;
    }
  ) {
    return prisma.emailJob.update({
      where: { id },
      data: {
        status,
        ...extra,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Find SCHEDULED jobs that should have been enqueued but might have been
   * lost due to a crash (startup reconciliation).
   */
  async findUnqueuedScheduled() {
    return prisma.emailJob.findMany({
      where: {
        status: EmailJobStatus.SCHEDULED,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  /**
   * Atomically transition status, only if current status matches expected.
   * Returns null if the transition was not possible (concurrent modification).
   */
  async transitionStatus(
    id: string,
    fromStatus: EmailJobStatus,
    toStatus: EmailJobStatus,
    extra?: {
      sentAt?: Date;
      smtpMessageId?: string;
      lastError?: string;
      scheduledAt?: Date;
    }
  ) {
    const result = await prisma.emailJob.updateMany({
      where: { id, status: fromStatus },
      data: {
        status: toStatus,
        ...extra,
        updatedAt: new Date(),
      },
    });
    return result.count > 0 ? await prisma.emailJob.findUnique({ where: { id } }) : null;
  },
};
