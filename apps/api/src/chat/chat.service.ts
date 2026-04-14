import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateChat(orderId: string) {
    return this.prisma.chat.upsert({
      where: { orderId },
      create: { orderId },
      update: {},
    });
  }

  async assertParticipant(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException();
    }
    return order;
  }

  async messages(orderId: string, userId: string) {
    await this.assertParticipant(orderId, userId);
    const chat = await this.getOrCreateChat(orderId);
    const items = await this.prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    return { items };
  }

  async postMessage(orderId: string, senderId: string, content: string) {
    await this.assertParticipant(orderId, senderId);
    const chat = await this.getOrCreateChat(orderId);
    const msg = await this.prisma.message.create({
      data: {
        chatId: chat.id,
        senderId,
        content,
        type: 'TEXT',
      },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    return msg;
  }
}
