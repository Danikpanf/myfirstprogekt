import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get('games')
  games() {
    return this.catalog.games();
  }

  @Get('listings')
  listings(
    @Query('gameId') gameId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('region') region?: string,
    @Query('sellerMinRating') sellerMinRating?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'price_asc' | 'price_desc' | 'new',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.catalog.listings({
      gameId,
      categoryId,
      subcategoryId,
      minPrice: minPrice != null ? Number(minPrice) : undefined,
      maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
      region,
      sellerMinRating: sellerMinRating != null ? Number(sellerMinRating) : undefined,
      search,
      sort,
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
    });
  }

  @Get('popular')
  popular() {
    return this.catalog.popular();
  }
}
