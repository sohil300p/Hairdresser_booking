import prisma from '../../All_Utils/config/prisma';
import { getRedisStatus, getRedisClient } from '../../All_Utils/config/redis';
import { getMinioStatus } from '../../All_Utils/config/minio';
import { SystemMetricsResponse } from './monitoring.type';
import os from 'os';

const startTime = Date.now();

export async function getSystemMetrics(): Promise<SystemMetricsResponse> {
  const timestamp = new Date().toISOString();
  
  // Server metrics
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryPercentage = (usedMemory / totalMemory) * 100;
  
  // CPU usage (approximate - using load average)
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuUsage = Math.min(100, (loadAvg[0] / cpus.length) * 20); // Rough estimate
  
  // Database metrics
  let databaseConnected = false;
  let databaseStatus = 'نامشخص';
  let activeConnections: number | undefined;
  let maxConnections: number | undefined;
  let connectionUsage: number | undefined;
  let queryTime: number | undefined;
  
  try {
    const startQuery = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    queryTime = Date.now() - startQuery;
    
    // Get connection pool info (MySQL specific)
    try {
      const connectionInfo = await prisma.$queryRaw<Array<{
        Variable_name: string;
        Value: string;
      }>>`
        SHOW STATUS WHERE Variable_name IN ('Threads_connected', 'Max_used_connections')
      `;
      
      const threadsConnected = connectionInfo.find(v => v.Variable_name === 'Threads_connected');
      const maxUsed = connectionInfo.find(v => v.Variable_name === 'Max_used_connections');
      
      if (threadsConnected) {
        activeConnections = parseInt(threadsConnected.Value) || 0;
      }
      
      // Get max connections
      try {
        const maxConnResult = await prisma.$queryRaw<Array<{
          Variable_name: string;
          Value: string;
        }>>`SHOW VARIABLES LIKE 'max_connections'`;
        
        const maxConn = maxConnResult[0];
        if (maxConn) {
          maxConnections = parseInt(maxConn.Value) || 100;
          connectionUsage = activeConnections ? (activeConnections / maxConnections) * 100 : 0;
        }
      } catch {
        // Ignore if query fails
      }
    } catch {
      // Ignore connection pool query errors
    }
    
    databaseConnected = true;
    databaseStatus = 'Connected';
  } catch (error) {
    databaseStatus = error instanceof Error ? error.message : 'خطای نامشخص';
  }
  
  // Redis metrics
  let redisConnected = false;
  let redisStatus = 'نامشخص';
  let redisMemory: { used: number; peak: number } | undefined;
  
  try {
    const redisStatusResult = await Promise.race([
      getRedisStatus(),
      new Promise<{ connected: boolean; error?: string }>((resolve) =>
        setTimeout(() => resolve({ connected: false, error: 'Timeout' }), 1000)
      ),
    ]);
    
    redisConnected = redisStatusResult.connected;
    redisStatus = redisConnected ? 'Connected' : redisStatusResult.error || 'Disconnected';
    
    if (redisConnected) {
      try {
        const client = getRedisClient();
        const info = await client.info('memory');
        const usedMatch = info.match(/used_memory:(\d+)/);
        const peakMatch = info.match(/used_memory_peak:(\d+)/);
        
        if (usedMatch && peakMatch) {
          redisMemory = {
            used: parseInt(usedMatch[1]) || 0,
            peak: parseInt(peakMatch[1]) || 0,
          };
        }
      } catch {
        // Ignore memory info errors
      }
    }
  } catch (error) {
    redisStatus = error instanceof Error ? error.message : 'خطای نامشخص';
  }
  
  // MinIO metrics
  let minioConnected = false;
  let minioStatus = 'نامشخص';
  
  try {
    const minioStatusResult = await Promise.race([
      getMinioStatus(),
      new Promise<{ connected: boolean; error?: string }>((resolve) =>
        setTimeout(() => resolve({ connected: false, error: 'Timeout' }), 2000)
      ),
    ]);
    minioConnected = minioStatusResult.connected;
    minioStatus = minioConnected ? 'Connected' : minioStatusResult.error || 'Disconnected';
  } catch (error) {
    minioStatus = error instanceof Error ? error.message : 'خطای نامشخص';
  }
  
  // User metrics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const todayStartBigInt = BigInt(todayStart.getTime());
  
  const oneHourAgoBigInt = BigInt(oneHourAgo.getTime());
  const todayStartBigIntForCustomer = BigInt(todayStart.getTime());

  const [totalUsers, activeToday, activeLastHour, newToday] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({
      where: {
        last_login: {
          gte: todayStartBigIntForCustomer,
        },
      },
    }),
    prisma.customer.count({
      where: {
        last_login: {
          gte: oneHourAgoBigInt,
        },
      },
    }),
    prisma.customer.count({
      where: {
        created: {
          gte: todayStartBigIntForCustomer,
        },
      },
    }),
  ]);
  
  // Appointment metrics
  const [totalAppointments, todayAppointments, pendingAppointments, confirmedAppointments] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        created: {
          gte: todayStartBigInt,
        },
      },
    }),
    prisma.appointment.count({
      where: {
        status: 'pending',
      },
    }),
    prisma.appointment.count({
      where: {
        status: 'confirmed',
      },
    }),
  ]);
  
  // Barber metrics
  const [totalBarbers, activeBarbers] = await Promise.all([
    prisma.barber.count(),
    prisma.barber.count({
      where: {
        ownedBarbershops: {
          some: {
            active: true,
          },
        },
      },
    }),
  ]);
  
  return {
    success: true,
    timestamp,
    server: {
      uptime,
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage * 100) / 100,
      },
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        loadAverage: loadAvg,
      },
      nodeVersion: process.version,
      platform: `${os.type()} ${os.release()}`,
    },
    database: {
      connected: databaseConnected,
      activeConnections,
      maxConnections,
      connectionUsage: connectionUsage ? Math.round(connectionUsage * 100) / 100 : undefined,
      queryTime,
      status: databaseStatus,
    },
    redis: {
      connected: redisConnected,
      memory: redisMemory,
      status: redisStatus,
    },
    minio: {
      connected: minioConnected,
      status: minioStatus,
    },
    users: {
      total: totalUsers,
      activeToday,
      activeLastHour,
      newToday,
    },
    appointments: {
      total: totalAppointments,
      today: todayAppointments,
      pending: pendingAppointments,
      confirmed: confirmedAppointments,
    },
    barbers: {
      total: totalBarbers,
      active: activeBarbers,
    },
  };
}

