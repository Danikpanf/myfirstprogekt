import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        sellerVerified: true,
        trustScore: true,
        createdAt: true,
        lastSeenAt: true,
        twoFactorEnabled: true,
        _count: {
          select: {
            ordersAsBuyer: true,
            ordersAsSeller: true,
            reviewsReceived: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException();
    return {
      ...user,
      dealsCount: user._count.ordersAsBuyer + user._count.ordersAsSeller,
      reviewsCount: user._count.reviewsReceived,
      _count: undefined,
    };
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        sellerVerified: true,
        trustScore: true,
        createdAt: true,
        lastSeenAt: true,
        _count: {
          select: {
            ordersAsBuyer: true,
            ordersAsSeller: true,
            reviewsReceived: true,
 },
        },
      },
    });
    if (!user) throw new NotFoundException();
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: userId, status: 'VISIBLE' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { reviewer: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    const avg = await this.prisma.review.aggregate({
      where: { revieweeId: userId, status: 'VISIBLE' },
      _avg: { rating: true },
    });
    return {
      ...user,
      dealsCount: user._count.ordersAsBuyer + user._count.ordersAsSeller,
      reviewsCount: user._count.reviewsReceived,
      ratingAvg: avg._avg.rating ? Number(avg._avg.rating) : null,
      reviews,
      _count: undefined,
    };
  }

  async heartbeat(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
    return { ok: true };
  }
}
