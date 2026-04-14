import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateListingDto {
  @IsUUID()
  gameId: string;

  @IsUUID()
  categoryId: string;

  @IsUUID()
  subcategoryId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  priceAmount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  deliveryTimeHours?: number;

  @IsOptional()
  @IsString()
  region?: string;
}
