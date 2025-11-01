import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './config/prisma';
import routes from './routes/routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
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

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

// Start the server
startServer();

// Export app and prisma for testing or other modules
export { app, prisma };
