export interface SystemMetricsResponse {
  success: boolean;
  timestamp: string;
  server: {
    uptime: number; // seconds
    memory: {
      used: number; // MB
      total: number; // MB
      percentage: number; // 0-100
    };
    cpu: {
      usage: number; // 0-100 (approximate)
      loadAverage?: number[];
    };
    nodeVersion: string;
    platform: string;
  };
  database: {
    connected: boolean;
    activeConnections?: number;
    maxConnections?: number;
    connectionUsage?: number; // 0-100
    queryTime?: number; // ms
    status: string;
  };
  redis: {
    connected: boolean;
    memory?: {
      used: number; // bytes
      peak: number; // bytes
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

