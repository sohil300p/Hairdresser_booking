import { Client } from 'minio';
import dotenv from 'dotenv';

dotenv.config();

// MinIO configuration from environment variables
// endPoint must be hostname only (no port); port is separate
const rawEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const [endPointHost, endpointPort] = rawEndpoint.includes(':')
  ? rawEndpoint.split(':')
  : [rawEndpoint, null];
const minioConfig = {
  endPoint: endPointHost,
  port: parseInt(endpointPort || process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  region: process.env.MINIO_REGION || 'us-east-1',
  publicUrl: process.env.MINIO_PUBLIC_URL || `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
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
      await minioClient.makeBucket(DEFAULT_BUCKET, minioConfig.region);
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

// Test MinIO connection and authentication
async function testMinioConnection(): Promise<boolean> {
  try {
    // listBuckets() requires valid access key and secret key
    // This tests both connection and authentication
    await minioClient.listBuckets();
    return true;
  } catch (error) {
    console.error('❌ MinIO connection/authentication failed:', error);
    return false;
  }
}

// Get detailed MinIO connection status
export async function getMinioStatus(): Promise<{ connected: boolean; error?: string }> {
  try {
    await minioClient.listBuckets();
    return { connected: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Check if it's an authentication error
    if (errorMessage.includes('InvalidAccessKeyId') || errorMessage.includes('SignatureDoesNotMatch') || errorMessage.includes('403')) {
      return { connected: false, error: 'Authentication failed - check MINIO_ACCESS_KEY and MINIO_SECRET_KEY' };
    }
    // Check if it's a connection error
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('timeout')) {
      return { connected: false, error: 'Connection failed - check MINIO_ENDPOINT and MINIO_PORT' };
    }
    return { connected: false, error: errorMessage };
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
export { minioClient, DEFAULT_BUCKET, testMinioConnection, minioConfig };
export default minioClient;

