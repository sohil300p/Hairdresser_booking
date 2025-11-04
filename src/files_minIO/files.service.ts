import { minioClient, DEFAULT_BUCKET, ensureMinioInitialized } from '../config/minio';
import { UploadFileResponse, DeleteFileResponse } from './files.type';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Upload file to MinIO
 */
export async function uploadFileService(
  file: Express.Multer.File,
  folder?: string
): Promise<UploadFileResponse> {
  try {
    // Ensure MinIO is initialized
    await ensureMinioInitialized();

    // Generate unique file name
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const objectName = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Upload file to MinIO
    const metaData = {
      'Content-Type': file.mimetype,
      'Original-Name': file.originalname,
    };

    await minioClient.putObject(DEFAULT_BUCKET, objectName, file.buffer, file.size, metaData);

    // Construct file URL
    const fileUrl = `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}/${DEFAULT_BUCKET}/${objectName}`;

    return {
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
      fileName: objectName,
      fileSize: file.size,
      contentType: file.mimetype,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Download file from MinIO
 */
export async function downloadFileService(fileName: string, folder?: string): Promise<Buffer | null> {
  try {
    await ensureMinioInitialized();

    const objectName = folder ? `${folder}/${fileName}` : fileName;

    // Get file from MinIO
    const dataStream = await minioClient.getObject(DEFAULT_BUCKET, objectName);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of dataStream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

/**
 * Get file metadata from MinIO
 */
export async function getFileMetadataService(fileName: string, folder?: string) {
  try {
    await ensureMinioInitialized();

    const objectName = folder ? `${folder}/${fileName}` : fileName;
    const stat = await minioClient.statObject(DEFAULT_BUCKET, objectName);

    return {
      success: true,
      size: stat.size,
      contentType: stat.metaData['content-type'] || stat.metaData['Content-Type'],
      lastModified: stat.lastModified,
      etag: stat.etag,
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get file metadata',
    };
  }
}

/**
 * Delete file from MinIO
 */
export async function deleteFileService(
  fileName: string,
  folder?: string
): Promise<DeleteFileResponse> {
  try {
    await ensureMinioInitialized();

    const objectName = folder ? `${folder}/${fileName}` : fileName;
    await minioClient.removeObject(DEFAULT_BUCKET, objectName);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * List files in a folder
 */
export async function listFilesService(folder?: string) {
  try {
    await ensureMinioInitialized();

    const objectsList: string[] = [];
    const prefix = folder ? `${folder}/` : '';

    const objectsStream = minioClient.listObjects(DEFAULT_BUCKET, prefix, true);

    for await (const obj of objectsStream) {
      if (obj.name) {
        objectsList.push(obj.name);
      }
    }

    return {
      success: true,
      files: objectsList,
      count: objectsList.length,
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list files',
      files: [],
      count: 0,
    };
  }
}

