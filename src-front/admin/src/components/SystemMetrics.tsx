import React, { useEffect, useState } from 'react';
import { monitoringService, type SystemMetrics } from '../services/monitoring.service';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Server, 
  Database, 
  HardDrive, 
  Users, 
  Calendar, 
  Activity,
  Cpu,
  MemoryStick,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { MetricsCard } from './MetricsCard';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await monitoringService.getMetrics();
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchMetrics} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">System Monitoring</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Server Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Server Status
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Uptime"
            value={formatUptime(metrics.server.uptime)}
            icon={Activity}
            status="success"
          />
          <MetricsCard
            title="Memory Usage"
            value={`${metrics.server.memory.percentage.toFixed(1)}%`}
            subtitle={`${metrics.server.memory.used} MB / ${metrics.server.memory.total} MB`}
            icon={MemoryStick}
            status={getStatusColor(metrics.server.memory.percentage)}
          />
          <MetricsCard
            title="CPU Usage"
            value={`${metrics.server.cpu.usage.toFixed(1)}%`}
            icon={Cpu}
            status={getStatusColor(metrics.server.cpu.usage)}
          />
          <MetricsCard
            title="Platform"
            value={metrics.server.platform}
            subtitle={`Node ${metrics.server.nodeVersion}`}
            icon={Server}
          />
        </div>
      </div>

      {/* Database Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Status
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection</CardTitle>
              {metrics.database.connected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.database.connected ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.database.connected ? 'Connected' : 'Disconnected'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.database.status}</p>
            </CardContent>
          </Card>
          {metrics.database.activeConnections !== undefined && (
            <MetricsCard
              title="Active Connections"
              value={metrics.database.activeConnections}
              subtitle={metrics.database.maxConnections ? `Max: ${metrics.database.maxConnections}` : undefined}
              icon={Database}
              status={metrics.database.connectionUsage ? getStatusColor(metrics.database.connectionUsage) : undefined}
            />
          )}
          {metrics.database.connectionUsage !== undefined && (
            <MetricsCard
              title="Connection Usage"
              value={`${metrics.database.connectionUsage.toFixed(1)}%`}
              icon={Activity}
              status={getStatusColor(metrics.database.connectionUsage)}
            />
          )}
          {metrics.database.queryTime !== undefined && (
            <MetricsCard
              title="Query Time"
              value={`${metrics.database.queryTime}ms`}
              icon={Activity}
              status={metrics.database.queryTime > 100 ? 'warning' : 'success'}
            />
          )}
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Services Status
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redis</CardTitle>
              {metrics.redis.connected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${metrics.redis.connected ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.redis.connected ? 'Connected' : 'Disconnected'}
              </div>
              {metrics.redis.memory && (
                <p className="text-xs text-muted-foreground mt-1">
                  Memory: {formatBytes(metrics.redis.memory.used)} / Peak: {formatBytes(metrics.redis.memory.peak)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{metrics.redis.status}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MinIO</CardTitle>
              {metrics.minio.connected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${metrics.minio.connected ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.minio.connected ? 'Connected' : 'Disconnected'}
              </div>
              <p className="text-xs text-muted-foreground">{metrics.minio.status}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User & Business Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users & Activity
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Users"
            value={metrics.users.total}
            icon={Users}
          />
          <MetricsCard
            title="Active Today"
            value={metrics.users.activeToday}
            icon={Activity}
          />
          <MetricsCard
            title="Active Last Hour"
            value={metrics.users.activeLastHour}
            icon={Activity}
          />
          <MetricsCard
            title="New Today"
            value={metrics.users.newToday}
            icon={Users}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointments
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Appointments"
            value={metrics.appointments.total}
            icon={Calendar}
          />
          <MetricsCard
            title="Today"
            value={metrics.appointments.today}
            icon={Calendar}
          />
          <MetricsCard
            title="Pending"
            value={metrics.appointments.pending}
            icon={Calendar}
            status={metrics.appointments.pending > 50 ? 'warning' : undefined}
          />
          <MetricsCard
            title="Confirmed"
            value={metrics.appointments.confirmed}
            icon={CheckCircle2}
            status="success"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Barbers
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricsCard
            title="Total Barbers"
            value={metrics.barbers.total}
            icon={Users}
          />
          <MetricsCard
            title="Active Barbers"
            value={metrics.barbers.active}
            icon={Activity}
            status="success"
          />
        </div>
      </div>
    </div>
  );
}

