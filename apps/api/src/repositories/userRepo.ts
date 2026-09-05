import { prisma } from '../utils/prisma';

export const userRepo = {
  /**
   * Find or create user from Google OAuth profile.
   */
  async upsertFromGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }) {
    return prisma.user.upsert({
      where: { googleId: profile.googleId },
      update: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      create: {
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async updateSlackTokens(
    userId: string,
    data: {
      slackAccessToken: string;
      slackTeamId: string;
      slackTeamName: string;
      slackUserId: string;
      slackChannelId?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

  async clearSlackTokens(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        slackAccessToken: null,
        slackTeamId: null,
        slackTeamName: null,
        slackUserId: null,
        slackChannelId: null,
      },
    });
  },
};
