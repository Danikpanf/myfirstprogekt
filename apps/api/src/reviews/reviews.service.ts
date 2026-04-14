import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(buyerId: string, orderId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Отзыв только после завершения сделки');
    }
    const exists = await this.prisma.review.findUnique({ where: { orderId } });
    if (exists) throw new BadRequestException('Отзыв уже оставлен');
    return this.prisma.review.create({
      data: {
        orderId,
        reviewerId: buyerId,
        revieweeId: order.sellerId,
        rating: dto.rating,
        text: dto.text,
      },
    });
  }
}
