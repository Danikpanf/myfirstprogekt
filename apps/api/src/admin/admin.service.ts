import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, DisputeStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  users(q?: string) {
    return this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        trustScore: true,
      },
    });
  }

  async setUserStatus(actorId: string, userId: string, status: UserStatus, note?: string) {
    const before = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!before) throw new NotFoundException();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'user.status',
        entityType: 'User',
        entityId: userId,
        before: { status: before.status },
        after: { status, note: note ?? null },
      },
    });
    return user;
  }

  disputes() {
    return this.prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        order: {
          include: {
            listing: { select: { title: true } },
            buyer: { select: { id: true, displayName: true } },
            seller: { select: { id: true, displayName: true } },
          },
        },
      },
    });
  }

  async resolveDispute(
    actorId: string,
    disputeId: string,
    resolution: 'BUYER' | 'SELLER',
    note: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true },
    });
    if (!dispute) throw new NotFoundException();
    const status =
      resolution === 'BUYER' ? DisputeStatus.RESOLVED_BUYER : DisputeStatus.RESOLVED_SELLER;
    const orderStatus = resolution === 'BUYER' ? OrderStatus.REFUNDED : OrderStatus.COMPLETED;
    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status,
          resolverId: actorId,
          resolutionNote: note,
          resolvedAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: dispute.orderId },
        data: { status: orderStatus },
      });
      if (resolution === 'SELLER') {
        const order = dispute.order;
        const sellerAmount = Number(order.priceAmount) - Number(order.platformFeeAmount);
        const wallet = await tx.wallet.upsert({
          where: { userId: order.sellerId },
          create: { userId: order.sellerId, balance: 0, currency: order.currency },
          update: {},
        });
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: sellerAmount } },
        });
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            orderId: order.id,
            amount: sellerAmount,
            kind: 'DISPUTE_RELEASE_SELLER',
            meta: { disputeId },
          },
        });
      }
    });
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'dispute.resolve',
        entityType: 'Dispute',
        entityId: disputeId,
        after: { resolution, note },
      },
    });
    return this.prisma.dispute.findUnique({ where: { id: disputeId } });
  }

  analyticsSummary() {
    return this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.user.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
    ]).then(([orders, completed, users, listings]) => ({
      orders,
      completedDeals: completed,
      users,
      activeListings: listings,
    }));
  }
}
