import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { HealthCheckResponse } from '../types';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    const response: HealthCheckResponse = {
      status: 'OK',
      message: 'Server is running and database is connected',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        status: 'connected',
      },
    };

    res.status(200).json(response);
  } catch (error) {
    const response: HealthCheckResponse = {
      status: 'ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        status: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    res.status(500).json(response);
  }
};

