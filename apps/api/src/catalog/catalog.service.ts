import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingStatus, Prisma } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  games() {
    return this.prisma.game.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        categories: {
          orderBy: { name: 'asc' },
          include: { subcategories: { orderBy: { name: 'asc' } } },
        },
      },
    });
  }

  async listings(query: {
    gameId?: string;
    categoryId?: string;
    subcategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    region?: string;
    sellerMinRating?: number;
    search?: string;
    sort?: 'price_asc' | 'price_desc' | 'new';
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
    };
    if (query.gameId) where.gameId = query.gameId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.subcategoryId) where.subcategoryId = query.subcategoryId;
    if (query.region) where.region = query.region;
    if (query.minPrice != null || query.maxPrice != null) {
      where.priceAmount = {};
      if (query.minPrice != null) where.priceAmount.gte = query.minPrice;
      if (query.maxPrice != null) where.priceAmount.lte = query.maxPrice;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.sellerMinRating != null) {
      where.seller = {
        reviewsReceived: {
          some: {},
        },
      };
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
    if (query.sort === 'price_asc') orderBy.push({ priceAmount: 'asc' });
    else if (query.sort === 'price_desc') orderBy.push({ priceAmount: 'desc' });
    else orderBy.push({ createdAt: 'desc' });

    const take = Math.min(query.take ?? 24, 48);
    const skip = query.skip ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          game: { select: { id: true, slug: true, name: true } },
          category: { select: { id: true, slug: true, name: true } },
          subcategory: { select: { id: true, slug: true, name: true } },
          seller: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              trustScore: true,
              lastSeenAt: true,
              sellerVerified: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    let filtered = items;
    if (query.sellerMinRating != null) {
      const ids = items.map((i) => i.sellerId);
      const avgs = await this.prisma.review.groupBy({
        by: ['revieweeId'],
        where: { revieweeId: { in: ids }, status: 'VISIBLE' },
        _avg: { rating: true },
      });
      const map = new Map(avgs.map((a) => [a.revieweeId, a._avg.rating ?? 0]));
      filtered = items.filter((i) => (map.get(i.sellerId) ?? 5) >= query.sellerMinRating!);
    }

    return { items: filtered, total, skip, take };
  }

  async popular() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const grouped = await this.prisma.order.groupBy({
      by: ['listingId'],
      where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      _count: { listingId: true },
      orderBy: { _count: { listingId: 'desc' } },
      take: 12,
    });
    const ids = grouped.map((g) => g.listingId);
    const listings = await this.prisma.listing.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      include: {
        game: true,
        seller: { select: { id: true, displayName: true, trustScore: true } },
      },
    });
    const order = new Map(ids.map((id, idx) => [id, idx]));
    listings.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return listings;
  }
}
