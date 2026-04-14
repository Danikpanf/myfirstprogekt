import { IsString, MinLength } from 'class-validator';

export class DisputeDto {
  @IsString()
  @MinLength(2)
  reasonCode: string;

  @IsString()
  @MinLength(10)
  description: string;
}
