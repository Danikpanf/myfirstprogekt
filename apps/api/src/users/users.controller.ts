import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('users/me')
  me(@CurrentUser() user: { id: string }) {
    return this.users.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('users/me/heartbeat')
  heartbeat(@CurrentUser() user: { id: string }) {
    return this.users.heartbeat(user.id);
  }

  @Get('users/:id/public')
  publicProfile(@Param('id') id: string) {
    return this.users.getPublicProfile(id);
  }
}
