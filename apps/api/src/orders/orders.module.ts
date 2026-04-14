import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderEventsService } from './order-events.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsService],
  exports: [OrdersService, OrderEventsService],
})
export class OrdersModule {}
