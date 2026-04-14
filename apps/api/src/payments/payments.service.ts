import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

/** Заглушка платежей: в проде заменить на Stripe / crypto / агрегатор. */
@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
  ) {}

  async mockPay(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    await this.prisma.payment.create({
      data: {
        orderId,
        provider: 'mock',
        providerRef: `mock_${Date.now()}`,
        amount: order.priceAmount,
        currency: order.currency,
        status: 'SUCCEEDED',
      },
    });
    return this.orders.markPaid(orderId);
  }
}
