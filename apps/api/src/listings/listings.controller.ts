import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('listings')
export class ListingsController {
  constructor(private listings: ListingsService) {}

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.listings.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateListingDto) {
    return this.listings.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/promote')
  promote(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.listings.promote(id, user.id);
  }
}
