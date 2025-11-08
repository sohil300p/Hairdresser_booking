import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getRedisStatus } from '../config/redis';
import { getMinioStatus } from '../config/minio';
import { HealthCheckResponse } from './helth.type';

// Cache health check results to avoid hitting services on every request
// Standard practice: cache for 5-10 seconds, update in background
interface CachedHealthStatus {
  timestamp: number;
  data: HealthCheckResponse;
}

let cachedHealthStatus: CachedHealthStatus | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds cache

async function performHealthCheck(): Promise<HealthCheckResponse> {
  const timestamp = new Date().toISOString();
  let databaseConnected = false;
  let databaseStatus = 'نامشخص';
  let redisConnected = false;
  let redisStatus = 'نامشخص';
  let minioConnected = false;
  let minioStatus = 'نامشخص';

  try {
    // Lightweight database check (connection pool is already established)
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
    databaseStatus = 'Connected.';
  } catch (error) {
    databaseStatus = error instanceof Error ? error.message : 'خطای نامشخص';
  }

  try {
    // Redis check with timeout to prevent hanging
    const redisStatusResult = await Promise.race([
      getRedisStatus(),
      new Promise<{ connected: boolean; error?: string }>((resolve) =>
        setTimeout(() => resolve({ connected: false, error: 'Timeout' }), 1000)
      ),
    ]);
    redisConnected = redisStatusResult.connected;
    redisStatus = redisConnected ? 'Connected' : redisStatusResult.error || 'Disconnected';
  } catch (error) {
    redisStatus = error instanceof Error ? error.message : 'خطای نامشخص';
  }

  try {
    // MinIO check with timeout to prevent hanging
    const minioStatusResult = await Promise.race([
      getMinioStatus(),
      new Promise<{ connected: boolean; error?: string }>((resolve) =>
        setTimeout(() => resolve({ connected: false, error: 'Timeout' }), 2000)
      ),
    ]);
    minioConnected = minioStatusResult.connected;
    minioStatus = minioConnected ? 'Connected and authenticion is successfully.' : minioStatusResult.error || 'Disconnected';
  } catch (error) {
    minioStatus = error instanceof Error ? error.message : 'خطای نامشخص';
  }

  const allServicesConnected = databaseConnected && redisConnected && minioConnected;
  return {
    status: allServicesConnected ? 'OK' : 'ERROR',
    message: allServicesConnected
      ? 'The server is running and connected to all services.'
      : 'سرور در حال اجراست اما برخی سرویس‌ها در دسترس نیستند',
    timestamp,
    database: {
      connected: databaseConnected,
      status: databaseStatus,
    },
    redis: {
      connected: redisConnected,
      status: redisStatus,
    },
    minio: {
      connected: minioConnected,
      status: minioStatus,
    },
  };
}

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const now = Date.now();

  // Return cached result if still valid
  if (cachedHealthStatus && (now - cachedHealthStatus.timestamp) < CACHE_TTL_MS) {
    res.status(cachedHealthStatus.data.status === 'OK' ? 200 : 503).json(cachedHealthStatus.data);
    return;
  }

  // Perform health check and cache result
  const healthData = await performHealthCheck();
  cachedHealthStatus = {
    timestamp: now,
    data: healthData,
  };

  res.status(healthData.status === 'OK' ? 200 : 503).json(healthData);
};

