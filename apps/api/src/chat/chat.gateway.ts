import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Subscription } from 'rxjs';
import { OrderEventsService } from '../orders/order-events.service';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private sub: Subscription | null = null;

  constructor(
    private jwt: JwtService,
    private orderEvents: OrderEventsService,
    private chat: ChatService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.sub = this.orderEvents.updates.subscribe(({ orderId, payload }) => {
      this.server.to(`order:${orderId}`).emit('order.updated', payload);
    });
  }

  onModuleDestroy() {
    this.sub?.unsubscribe();
  }

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers.authorization as string)?.replace('Bearer ', '');
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string }) {
    const userId = client.data.userId as string;
    if (!body?.orderId) return;
    try {
      await this.chat.assertParticipant(body.orderId, userId);
    } catch {
      return;
    }
    await client.join(`order:${body.orderId}`);
    client.emit('joined', { orderId: body.orderId });
  }

  @SubscribeMessage('chat.message')
  async chatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { orderId: string; content: string },
  ) {
    const userId = client.data.userId as string;
    if (!body?.orderId || !body?.content?.trim()) return;
    const msg = await this.chat.postMessage(body.orderId, userId, body.content.trim());
    this.server.to(`order:${body.orderId}`).emit('message.created', msg);
  }

  @SubscribeMessage('typing')
  typing(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string }) {
    const userId = client.data.userId as string;
    if (!body?.orderId) return;
    client.to(`order:${body.orderId}`).emit('typing', { userId });
  }

  /** Presence: онлайн если lastSeen < 5 мин (обновляется heartbeat с клиента). */
  async onlineStatus(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenAt: true },
    });
    if (!u) return false;
    return Date.now() - u.lastSeenAt.getTime() < 5 * 60 * 1000;
  }
}
