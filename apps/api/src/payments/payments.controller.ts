import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  /** Только для разработки / демо. В проде — webhook провайдера. */
  @Post('mock/:orderId')
  mock(@CurrentUser() user: { id: string }, @Param('orderId') orderId: string) {
    return this.payments.mockPay(orderId, user.id);
  }
}
