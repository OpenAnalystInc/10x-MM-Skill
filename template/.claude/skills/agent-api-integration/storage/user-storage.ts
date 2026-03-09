import { ApiClient } from '../client/api-client';
import pino from 'pino';

const logger = pino({ name: 'user-storage' });

export interface UserStorageConfig {
  endpoint: string;
  apiKey: string;
  userId: string;
}

export class UserStorage {
  private client: ApiClient;
  private userId: string;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(config: UserStorageConfig) {
    this.userId = config.userId;
    this.client = new ApiClient({
      baseURL: config.endpoint,
      apiKey: config.apiKey,
      rateLimit: { maxRequests: 50, windowMs: 60000 },
    });
  }

  async get(key: string): Promise<any | null> {
    const cacheKey = `${this.userId}:${key}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) return cached.data;

    try {
      const data = await this.client.get(`/storage/${this.userId}/${key}`);
      this.cache.set(cacheKey, { data, expiry: Date.now() + this.cacheTTL });
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  }

  async set(key: string, value: any): Promise<void> {
    await this.client.put(`/storage/${this.userId}/${key}`, value);
    this.cache.set(`${this.userId}:${key}`, {
      data: value,
      expiry: Date.now() + this.cacheTTL,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.delete(`/storage/${this.userId}/${key}`);
    this.cache.delete(`${this.userId}:${key}`);
  }

  async list(prefix?: string): Promise<string[]> {
    const path = prefix
      ? `/storage/${this.userId}?prefix=${prefix}`
      : `/storage/${this.userId}`;
    return this.client.get(path);
  }
}
