import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { RateLimiter } from './rate-limiter';
import { AuthManager } from './auth';
import pino from 'pino';

const logger = pino({ name: 'api-client' });

export interface ApiClientConfig {
  baseURL: string;
  apiKey?: string;
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: { maxRequests: number; windowMs: number };
  timeout?: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private authManager: AuthManager;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: ApiClientConfig) {
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.rateLimiter = new RateLimiter(
      config.rateLimit?.maxRequests ?? 100,
      config.rateLimit?.windowMs ?? 60000
    );
    this.authManager = new AuthManager(config.apiKey);

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((req) => {
      const token = this.authManager.getAuthHeader();
      if (token) req.headers.Authorization = token;
      return req;
    });
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    await this.rateLimiter.acquire();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return response.data;
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          const status = axiosError.response.status;
          if (status >= 400 && status < 500 && status !== 429) {
            throw error;
          }
        }

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          logger.warn({ attempt, delay, error: lastError.message }, 'Retrying request');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async get<T>(url: string, params?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url, params });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url });
  }
}
