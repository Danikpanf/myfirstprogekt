import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { DisputeDto } from './dto/dispute.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Get('mine')
  mine(
    @CurrentUser() user: { id: string },
    @Query('role') role: 'buyer' | 'seller' = 'buyer',
  ) {
    return this.orders.mine(user.id, role);
  }

  @Get(':id')
  getOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.getOne(id, user.id);
  }

  @Post(':id/confirm')
  confirm(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.orders.confirmByBuyer(id, user.id);
  }

  @Post(':id/dispute')
  dispute(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: DisputeDto) {
    return this.orders.openDispute(id, user.id, dto);
  }
}
