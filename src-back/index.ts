import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './config/prisma';
import { getRedisClient, isRedisConnected } from './config/redis';
import { ensureMinioInitialized, testMinioConnection } from './config/minio';
import routes from './routes/routes';

const redisClient = getRedisClient();

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Barber Booking API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      otpSend: 'POST /api/otp/send',
      otpVerify: 'POST /api/otp/verify',
      authRefresh: 'POST /api/auth/refresh-token',
      authVerify: 'POST /api/auth/verify-token',
      authLogout: 'POST /api/auth/logout',
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

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📱 OTP send: POST http://localhost:${PORT}/api/otp/send`);
      console.log(`🔐 OTP verify: POST http://localhost:${PORT}/api/otp/verify`);
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  if (isRedisConnected()) {
    await redisClient.quit().catch(() => {});
  }
  console.log('✅ Database and Redis disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  if (isRedisConnected()) {
    await redisClient.quit().catch(() => {});
  }
  console.log('✅ Database and Redis disconnected');
  process.exit(0);
});

// Start the server
startServer();

// Export app and prisma for testing or other modules
export { app, prisma };
