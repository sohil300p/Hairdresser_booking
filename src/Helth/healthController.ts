import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { HealthCheckResponse } from './helth.type';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    const response: HealthCheckResponse = {
      status: 'OK',
      message: 'سرور در حال اجراست و به دیتابیس متصل است',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        status: 'متصل',
      },
    };

    res.status(200).json(response);
  } catch (error) {
    const response: HealthCheckResponse = {
      status: 'ERROR',
      message: 'اتصال به دیتابیس با خطا مواجه شد',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        status: error instanceof Error ? error.message : 'خطای نامشخص',
      },
    };

    res.status(500).json(response);
  }
};

