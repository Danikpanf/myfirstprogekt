import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 11;
const MAX_LOGIN_FAILS = 8;
const BRUTE_WINDOW_SEC = 900;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
  ) {}

  private hashRefresh(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async assertNotLocked(email: string) {
    const key = `login:lock:${email.toLowerCase()}`;
    const locked = await this.redis.get(key);
    if (locked) throw new HttpException('Повторите попытку позже', HttpStatus.TOO_MANY_REQUESTS);
  }

  private async recordLoginFail(email: string, ip?: string) {
    const n = await this.redis.incrBrute(`login:fail:${email.toLowerCase()}`, BRUTE_WINDOW_SEC);
    await this.prisma.loginAttempt.create({
      data: { email: email.toLowerCase(), ip: ip ?? null, success: false },
    });
    if (n >= MAX_LOGIN_FAILS) {
      await this.redis.set(`login:lock:${email.toLowerCase()}`, '1', BRUTE_WINDOW_SEC);
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email уже занят');
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const referralCode = randomBytes(4).toString('hex').toUpperCase();
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName: dto.displayName,
        passwordHash,
        referralCode,
      },
      select: { id: true, email: true, displayName: true, role: true },
    });
    await this.ensureWallet(user.id);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto, ip?: string) {
    await this.assertNotLocked(dto.email);
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      await this.recordLoginFail(email, ip);
      throw new UnauthorizedException('Неверные учётные данные');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.recordLoginFail(email, ip);
      throw new UnauthorizedException('Неверные учётные данные');
    }
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Аккаунт заблокирован');
    await this.prisma.loginAttempt.create({
      data: { email, ip: ip ?? null, success: true },
    });
    await this.redis.redis.del(`login:fail:${email}`);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });
    return this.issueTokens({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });
  }

  private async ensureWallet(userId: string) {
    await this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0, currency: 'RUB' },
      update: {},
    });
  }

  private async issueTokens(user: { id: string; email: string | null; displayName: string; role: string }) {
    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashRefresh(refreshToken);
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
    const refreshJwt = await this.jwt.signAsync(
      { sub: user.id, rt: tokenHash },
      { secret: refreshSecret, expiresIn: '30d' },
    );
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    return {
      accessToken,
      refreshToken: refreshJwt,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async refresh(refreshJwt: string) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
    let payload: { sub: string; rt: string };
    try {
      payload = await this.jwt.verifyAsync(refreshJwt, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException();
    }
    const row = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash: payload.rt, expiresAt: { gt: new Date() } },
    });
    if (!row) throw new UnauthorizedException();
    await this.prisma.refreshToken.delete({ where: { id: row.id } });
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, displayName: true, role: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException();
    return this.issueTokens(user);
  }

  async validateRegisterDto(dto: RegisterDto) {
    return dto;
  }
}
