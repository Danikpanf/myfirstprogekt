import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    OrdersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
