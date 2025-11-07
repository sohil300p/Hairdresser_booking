// File Upload/Download Request/Response Types

export interface UploadFileRequest {
  file: Express.Multer.File;
  folder?: string; // Optional folder path within bucket
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

export interface DownloadFileRequest {
  fileName: string;
  folder?: string;
}

export interface DeleteFileRequest {
  fileName: string;
  folder?: string;
}

export interface DeleteFileResponse {
  success: boolean;
  message: string;
}

