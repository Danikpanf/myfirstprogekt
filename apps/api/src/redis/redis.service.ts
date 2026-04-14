import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;

  get redis(): Redis {
    if (!this.client) {
      const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
      this.client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
    }
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async incrBrute(key: string, ttlSec: number): Promise<number> {
    const n = await this.redis.incr(key);
    if (n === 1) await this.redis.expire(key, ttlSec);
    return n;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    if (ttlSec) await this.redis.set(key, value, 'EX', ttlSec);
    else await this.redis.set(key, value);
  }
}
