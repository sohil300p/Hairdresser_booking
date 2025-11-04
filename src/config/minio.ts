import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

// MinIO configuration from environment variables
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
};

// Create MinIO client
const minioClient = new Client({
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL,
  accessKey: minioConfig.accessKey,
  secretKey: minioConfig.secretKey,
});

// Default bucket name
const DEFAULT_BUCKET = process.env.MINIO_BUCKET_NAME || 'barber-uploads';

// Initialize bucket (create if doesn't exist)
async function initializeBucket(): Promise<void> {
  try {
    const bucketExists = await minioClient.bucketExists(DEFAULT_BUCKET);
    
    if (!bucketExists) {
      await minioClient.makeBucket(DEFAULT_BUCKET, 'us-east-1');
      console.log(`✅ MinIO bucket '${DEFAULT_BUCKET}' created successfully`);
      
      // Set bucket policy to public read (optional - adjust based on your needs)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${DEFAULT_BUCKET}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(DEFAULT_BUCKET, JSON.stringify(policy));
      console.log(`✅ MinIO bucket policy set for '${DEFAULT_BUCKET}'`);
    } else {
      console.log(`✅ MinIO bucket '${DEFAULT_BUCKET}' already exists`);
    }
  } catch (error) {
    console.error('❌ Error initializing MinIO bucket:', error);
    throw error;
  }
}

// Test MinIO connection
async function testMinioConnection(): Promise<boolean> {
  try {
    await minioClient.listBuckets();
    return true;
  } catch (error) {
    console.error('❌ MinIO connection failed:', error);
    return false;
  }
}

// Initialize on module load
let isInitialized = false;

export async function ensureMinioInitialized(): Promise<void> {
  if (!isInitialized) {
    const isConnected = await testMinioConnection();
    if (isConnected) {
      await initializeBucket();
      isInitialized = true;
    } else {
      console.warn('⚠️ MinIO not connected. File upload features may not work.');
    }
  }
}

// Export MinIO client and utilities
export { minioClient, DEFAULT_BUCKET, testMinioConnection };
export default minioClient;

