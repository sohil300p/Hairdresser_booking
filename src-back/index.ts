import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './All_Utils/config/prisma';
import { getRedisClient, isRedisConnected } from './All_Utils/config/redis';
import { ensureMinioInitialized, testMinioConnection } from './All_Utils/config/minio';
import { initializeFirebase } from './All_Utils/Notification/firebase';
import routes from './All_Utils/routes/routes';
import { mapirProxyController, mapirSearchController, mapirReverseController } from './All_Utils/Mapir/mapir-proxy.controller';

const redisClient = getRedisClient();

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
}));

// Map.ir tile proxy (before json middleware so POST body stays raw for binary tiles)
app.get('/api/mapir/proxy', mapirProxyController);
app.post('/api/mapir/proxy', express.raw({ type: () => true }), mapirProxyController);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Map.ir search & reverse (registered on app so path is guaranteed)
app.get('/api/mapir/search', mapirSearchController);
app.post('/api/mapir/search', mapirSearchController);
app.get('/api/mapir/reverse', mapirReverseController);

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Barber Booking API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        loginPassword: 'POST /api/auth/login/password',
        loginOtp: 'POST /api/auth/login/otp',
        refreshToken: 'POST /api/auth/refresh-token',
        verifyToken: 'POST /api/auth/verify-token',
        logout: 'POST /api/auth/logout',
      },
      otp: {
        send: 'POST /api/otp/send',
        verify: 'POST /api/otp/verify',
      },
      transactions: {
        balance: 'GET /api/transactions/wallet/balance',
        deposit: 'POST /api/transactions/deposit',
        withdraw: 'POST /api/transactions/withdraw',
        transfer: 'POST /api/transactions/transfer',
        history: 'GET /api/transactions/history',
        lock: 'POST /api/transactions/lock',
      },
      packages: {
        list: 'GET /api/packages',
        purchase: 'POST /api/packages/purchase',
        myPackages: 'GET /api/packages/my-packages',
      },
      coupons: {
        validate: 'POST /api/coupons/validate',
        available: 'GET /api/coupons/available',
      },
      revenueShare: {
        config: 'GET /api/revenue-share/config',
        calculate: 'POST /api/revenue-share/calculate',
      },
      appointments: {
        availability: 'GET /api/appointments/availability',
        create: 'POST /api/appointments',
        list: 'GET /api/appointments',
        get: 'GET /api/appointments/:id',
        updateStatus: 'PUT /api/appointments/:id/status',
        cancel: 'POST /api/appointments/:id/cancel',
        reschedule: 'POST /api/appointments/:id/reschedule',
      },
      payment: {
        request: 'POST /api/payment/request',
        verify: 'GET /api/payment/verify (callback)',
        verifyApi: 'POST /api/payment/verify',
      },
    },
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection before starting server
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test Redis connection (non-blocking)
    if (isRedisConnected()) {
      console.log('✅ Redis connected successfully');
    } else {
      console.warn('⚠️ Redis not connected. OTP features may not work properly.');
      console.warn('To start Redis: docker compose up -d redis');
      console.warn('Or manually: docker run -d -p 6379:6379 redis:7-alpine');
    }

    // Initialize MinIO (non-blocking)
    try {
      const minioConnected = await testMinioConnection();
      if (minioConnected) {
        await ensureMinioInitialized();
        console.log('✅ MinIO connected and initialized successfully');
      } else {
        console.warn('⚠️ MinIO not connected. File upload features may not work.');
        console.warn('To start MinIO: docker compose up -d minio');
      }
    } catch (minioError) {
      console.warn('⚠️ MinIO initialization failed:', minioError);
    }

    // Initialize Firebase (non-blocking)
    try {
      initializeFirebase();
    } catch (firebaseError) {
      console.warn('⚠️ Firebase initialization failed:', firebaseError);
      console.warn('⚠️ Push notifications will not work without Firebase configuration.');
    }

    // Start listening
    serverInstance = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📱 OTP send: POST http://localhost:${PORT}/api/otp/send`);
      console.log(`🔐 OTP verify: POST http://localhost:${PORT}/api/otp/verify`);
    });

    // Handle port already in use error
    serverInstance.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the process using this port or use a different port.`);
        console.error(`💡 To find and kill the process: netstat -ano | findstr :${PORT}`);
        console.error(`💡 Then kill it: taskkill /F /PID <PID>`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    if (isRedisConnected()) {
      await redisClient.quit().catch(() => {});
    }
    process.exit(1);
  }
}

// Store server instance for graceful shutdown
let serverInstance: any = null;

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down server...`);
  
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('✅ HTTP server closed');
    });
  }
  
  await prisma.$disconnect();
  if (isRedisConnected()) {
    await redisClient.quit().catch(() => {});
  }
  console.log('✅ Database and Redis disconnected');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the server
startServer();

// Export app and prisma for testing or other modules
export { app, prisma };

