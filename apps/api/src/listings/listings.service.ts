import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        game: true,
        category: true,
        subcategory: true,
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            sellerVerified: true,
            lastSeenAt: true,
            createdAt: true,
          },
        },
      },
    });
    if (!listing) throw new NotFoundException();
    const avg = await this.prisma.review.aggregate({
      where: { revieweeId: listing.sellerId, status: 'VISIBLE' },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      ...listing,
      sellerRatingAvg: avg._avg.rating ? Number(avg._avg.rating) : null,
      sellerReviewsCount: avg._count.rating,
    };
  }

  async create(sellerId: string, dto: CreateListingDto) {
    const sub = await this.prisma.subcategory.findUnique({
      where: { id: dto.subcategoryId },
      include: { category: true },
    });
    if (!sub || sub.categoryId !== dto.categoryId || sub.category.gameId !== dto.gameId) {
      throw new ForbiddenException('Неверная иерархия игры/категории');
    }
    return this.prisma.listing.create({
      data: {
        sellerId,
        gameId: dto.gameId,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        title: dto.title,
        description: dto.description,
        priceAmount: dto.priceAmount,
        currency: dto.currency ?? 'RUB',
        quantity: dto.quantity ?? 1,
        deliveryTimeHours: dto.deliveryTimeHours ?? 24,
        region: dto.region,
        status: 'ACTIVE',
      },
    });
  }

  async promote(listingId: string, sellerId: string, days = 7) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.sellerId !== sellerId) throw new NotFoundException();
    const until = new Date(Date.now() + days * 86400000);
    return this.prisma.listing.update({
      where: { id: listingId },
      data: { promotedUntil: until },
    });
  }
}
