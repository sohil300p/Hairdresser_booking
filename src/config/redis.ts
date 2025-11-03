import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: ReturnType<typeof createClient> | null = null;
let isConnected = false;

/**
 * Get Redis client instance
 */
export function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      console.warn('⚠️ Redis disconnected');
      isConnected = false;
    });

    // Connect to Redis (don't block if it fails)
    redisClient.connect().catch((err) => {
      console.warn('⚠️ Failed to connect to Redis:', err.message);
      console.warn('⚠️ OTP features will not work until Redis is available');
      isConnected = false;
    });
  }

  return redisClient;
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return isConnected;
}

/**
 * Safe Redis operation wrapper
 */
export async function safeRedisOperation<T>(
  operation: (client: ReturnType<typeof createClient>) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const client = getRedisClient();
    if (!isRedisConnected()) {
      console.warn('⚠️ Redis not connected, using fallback');
      return fallback;
    }
    return await operation(client);
  } catch (error) {
    console.error('Redis operation failed:', error);
    return fallback;
  }
}

export default getRedisClient();
