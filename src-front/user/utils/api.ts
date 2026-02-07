import { AppContextType } from '../types';

let logoutHandler: AppContextType['logout'] | null = null;
let showToastHandler: AppContextType['showToast'] | null = null;

export const setAuthHandlers = (logout: AppContextType['logout'], showToast: AppContextType['showToast']) => {
  logoutHandler = logout;
  showToastHandler = showToast;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = {
  get: async <T>(path: string): Promise<T> => request('GET', path),
  post: async <T>(path: string, body: any): Promise<T> => request('POST', path, body),
  put: async <T>(path: string, body: any): Promise<T> => request('PUT', path, body),
  delete: async <T>(path: string): Promise<T> => request('DELETE', path),
  upload: async <T>(path: string, formData: FormData): Promise<T> => request('POST', path, formData, true),
  uploadPut: async <T>(path: string, formData: FormData): Promise<T> => request('PUT', path, formData, true),
};

async function request<T>(method: string, path: string, body?: any, isFormData: boolean = false): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, config);

    if (response.status === 401) {
      let errorMessage = 'جلسه شما منقضی شده است. لطفاً مجدداً وارد شوید';
      try {
        const errorData = await response.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // use default
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (logoutHandler) logoutHandler();
      if (showToastHandler) showToastHandler(errorMessage, 'error');
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, use status text
        errorData = { message: `API Error: ${response.statusText}` };
      }
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API Request Failed (${method} ${path}):`, error);
    throw error;
  }
}