import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { DisputeDto } from './dto/dispute.dto';
import { OrderEventsService } from './order-events.service';

const PLATFORM_FEE_RATE = 0.1;
const AUTO_CONFIRM_HOURS = 72;

@Injectable()
export class OrdersService implements OnModuleInit {
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private prisma: PrismaService,
    private orderEvents: OrderEventsService,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => {
      this.runAutoConfirm().catch(() => undefined);
    }, 60_000);
  }

  private fee(amount: Prisma.Decimal) {
    const n = Number(amount);
    return Math.round(n * PLATFORM_FEE_RATE * 100) / 100;
  }

  async create(buyerId: string, dto: CreateOrderDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing || listing.status !== 'ACTIVE') throw new NotFoundException('Лот недоступен');
    if (listing.sellerId === buyerId) throw new BadRequestException('Нельзя купить у себя');
    const platformFeeAmount = this.fee(listing.priceAmount);
    const order = await this.prisma.order.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId: listing.sellerId,
        priceAmount: listing.priceAmount,
        currency: listing.currency,
        platformFeeAmount,
        status: OrderStatus.AWAITING_PAYMENT,
      },
    });
    return order;
  }

  async mine(userId: string, role: 'buyer' | 'seller') {
    const where =
      role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        listing: { select: { id: true, title: true, priceAmount: true } },
      },
    });
  }

  async getOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
        dispute: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== userId && order.sellerId !== userId) throw new ForbiddenException();
    return order;
  }

  /** Вызывается после успешной оплаты (webhook / mock). */
  async markPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new BadRequestException('Заказ уже обработан');
    }
    const autoConfirmAt = new Date(Date.now() + AUTO_CONFIRM_HOURS * 3600 * 1000);
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.IN_DELIVERY,
          autoConfirmAt,
        },
      });
      await tx.chat.upsert({
        where: { orderId },
        create: { orderId },
        update: {},
      });
    });
    const full = await this.prisma.order.findUnique({ where: { id: orderId } });
    this.orderEvents.emit(orderId, full);
    return full;
  }

  async confirmByBuyer(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (order.status !== OrderStatus.IN_DELIVERY) {
      throw new BadRequestException('Неверный статус для подтверждения');
    }
    await this.completeAndPayout(orderId);
    const full = await this.prisma.order.findUnique({ where: { id: orderId } });
    this.orderEvents.emit(orderId, full);
    return full;
  }

  async openDispute(orderId: string, userId: string, dto: DisputeDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== userId && order.sellerId !== userId) throw new ForbiddenException();
    if (order.status !== OrderStatus.IN_DELIVERY) {
      throw new BadRequestException('Спор доступен только в доставке');
    }
    const openedBy = order.buyerId === userId ? 'BUYER' : 'SELLER';
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DISPUTED,
          disputeOpenedAt: new Date(),
          disputeReason: dto.reasonCode,
        },
      });
      await tx.dispute.create({
        data: {
          orderId,
          openedBy,
          reasonCode: dto.reasonCode,
          description: dto.description,
        },
      });
    });
    const full = await this.prisma.order.findUnique({ where: { id: orderId } });
    this.orderEvents.emit(orderId, full);
    return full;
  }

  private async completeAndPayout(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    const sellerAmount = Number(order.priceAmount) - Number(order.platformFeeAmount);
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED, autoConfirmAt: null },
      });
      const wallet = await tx.wallet.upsert({
        where: { userId: order.sellerId },
        create: { userId: order.sellerId, balance:0, currency: order.currency },
        update: {},
      });
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: sellerAmount } },
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          orderId,
          amount: sellerAmount,
          kind: 'ESCROW_RELEASE',
          meta: { fee: Number(order.platformFeeAmount) },
        },
      });
    });
  }

  private async runAutoConfirm() {
    const due = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.IN_DELIVERY,
        autoConfirmAt: { lte: new Date() },
      },
      take: 50,
    });
    for (const o of due) {
      try {
        await this.completeAndPayout(o.id);
        const full = await this.prisma.order.findUnique({ where: { id: o.id } });
        this.orderEvents.emit(o.id, full);
      } catch {
        /* ignore */
      }
    }
  }
}
