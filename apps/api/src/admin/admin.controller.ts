import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserStatus } from '@prisma/client';

class SetStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

class ResolveDisputeDto {
  @IsIn(['BUYER', 'SELLER'])
  resolution: 'BUYER' | 'SELLER';

  @IsString()
  @MinLength(5)
  note: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('users')
  users(@Query('q') q?: string) {
    return this.admin.users(q);
  }

  @Patch('users/:id/status')
  setStatus(
    @CurrentUser() actor: { id: string },
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.admin.setUserStatus(actor.id, id, dto.status, dto.note);
  }

  @Get('disputes')
  disputes() {
    return this.admin.disputes();
  }

  @Post('disputes/:id/resolve')
  resolve(
    @CurrentUser() actor: { id: string },
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.admin.resolveDispute(actor.id, id, dto.resolution, dto.note);
  }

  @Get('analytics/summary')
  @Roles('ADMIN')
  analytics() {
    return this.admin.analyticsSummary();
  }
}
