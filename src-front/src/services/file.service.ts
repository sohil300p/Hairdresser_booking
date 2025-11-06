import api from './api';

export interface UploadFileResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

export interface FileMetadataResponse {
  success: boolean;
  message?: string;
  size?: number;
  contentType?: string;
  lastModified?: string;
  etag?: string;
}

export interface ListFilesResponse {
  success: boolean;
  message?: string;
  files?: string[];
  count?: number;
}

export const fileService = {
  async uploadFile(file: File, folder?: string): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post<UploadFileResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async downloadFile(fileName: string, folder?: string): Promise<Blob> {
    const params = folder ? { folder } : {};
    const response = await api.get(`/files/download/${fileName}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async getFileMetadata(fileName: string, folder?: string): Promise<FileMetadataResponse> {
    const params = folder ? { folder } : {};
    const response = await api.get<FileMetadataResponse>(`/files/metadata/${fileName}`, { params });
    return response.data;
  },

  async deleteFile(fileName: string, folder?: string): Promise<{ success: boolean; message: string }> {
    const params = folder ? { folder } : {};
    const response = await api.delete(`/files/${fileName}`, { params });
    return response.data;
  },

  async listFiles(folder?: string): Promise<ListFilesResponse> {
    const params = folder ? { folder } : {};
    const response = await api.get<ListFilesResponse>('/files/list', { params });
    return response.data;
  },
};

