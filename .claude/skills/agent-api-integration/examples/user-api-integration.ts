import { ApiClient } from '../client/api-client';
import { UserStorage } from '../storage/user-storage';
import dotenv from 'dotenv';

dotenv.config();

async function exampleIntegration() {
  // 1. Create API client
  const api = new ApiClient({
    baseURL: process.env.USER_API_BASE_URL || 'https://api.example.com',
    apiKey: process.env.USER_API_KEY,
    rateLimit: { maxRequests: 60, windowMs: 60000 },
  });

  // 2. Fetch user data
  const campaigns = await api.get('/campaigns?status=active');
  console.log('Active campaigns:', campaigns);

  // 3. Store results in user-isolated storage
  const storage = new UserStorage({
    endpoint: process.env.USER_STORAGE_ENDPOINT || 'https://api.10x.in',
    apiKey: process.env.USER_API_KEY || '',
    userId: 'user-123',
  });

  await storage.set('last-campaign-fetch', {
    fetchedAt: new Date().toISOString(),
    count: (campaigns as any[]).length,
    data: campaigns,
  });

  console.log('Data stored successfully');
}

exampleIntegration().catch(console.error);
