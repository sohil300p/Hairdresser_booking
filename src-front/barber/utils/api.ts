let logoutHandler: (() => void) | null = null;
let showToastHandler: ((message: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export const setAuthHandlers = (
  logout: () => void,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
) => {
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
    credentials: 'include', // Include cookies for refresh token
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, config);

    if (response.status === 401) {
      let message = 'جلسه شما منقضی شده است. لطفاً مجدداً وارد شوید';
      try {
        const data = await response.json();
        if (data?.message) message = data.message;
      } catch {
        // use default message
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      if (logoutHandler) logoutHandler();
      if (showToastHandler) showToastHandler(message, 'error');
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API Request Failed (${method} ${path}):`, error);
    throw error;
  }
}

