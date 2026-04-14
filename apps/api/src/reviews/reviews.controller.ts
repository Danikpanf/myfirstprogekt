import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Post('order/:orderId')
  create(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(user.id, orderId, dto);
  }
}
