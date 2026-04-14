import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class PostMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chat: ChatService,
    private gateway: ChatGateway,
  ) {}

  @Get('order/:orderId/messages')
  messages(@CurrentUser() user: { id: string }, @Param('orderId') orderId: string) {
    return this.chat.messages(orderId, user.id);
  }

  @Post('order/:orderId/messages')
  async post(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
    @Body() dto: PostMessageDto,
  ) {
    const msg = await this.chat.postMessage(orderId, user.id, dto.content);
    this.gateway.server.to(`order:${orderId}`).emit('message.created', msg);
    return msg;
  }
}
