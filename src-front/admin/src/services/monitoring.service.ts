import api from './api';

export interface SystemMetrics {
  success: boolean;
  timestamp: string;
  server: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      loadAverage?: number[];
    };
    nodeVersion: string;
    platform: string;
  };
  database: {
    connected: boolean;
    activeConnections?: number;
    maxConnections?: number;
    connectionUsage?: number;
    queryTime?: number;
    status: string;
  };
  redis: {
    connected: boolean;
    memory?: {
      used: number;
      peak: number;
    };
    status: string;
  };
  minio: {
    connected: boolean;
    status: string;
  };
  users: {
    total: number;
    activeToday: number;
    activeLastHour: number;
    newToday: number;
  };
  appointments: {
    total: number;
    today: number;
    pending: number;
    confirmed: number;
  };
  barbers: {
    total: number;
    active: number;
  };
}

export const monitoringService = {
  async getMetrics(): Promise<SystemMetrics> {
    const response = await api.get<SystemMetrics>('/admin/monitoring/metrics');
    return response.data;
  },
};

