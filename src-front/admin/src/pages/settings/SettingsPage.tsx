import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Settings, Save, RefreshCw, Bell, Database, Server } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    autoRefresh: false,
    refreshInterval: 30,
    itemsPerPage: 20,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      setStatus({ type: 'success', message: 'Settings saved successfully!' });
      localStorage.setItem('admin_settings', JSON.stringify(settings));
    }, 500);
  };

  const handleReset = () => {
    setSettings({
      notificationsEnabled: true,
      autoRefresh: false,
      refreshInterval: 30,
      itemsPerPage: 20,
    });
    setStatus({ type: 'success', message: 'Settings reset to defaults' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure admin panel preferences and system settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for important events
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Display Settings
            </CardTitle>
            <CardDescription>
              Configure how data is displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemsPerPage">Items Per Page</Label>
              <Input
                id="itemsPerPage"
                type="number"
                min="10"
                max="100"
                value={settings.itemsPerPage}
                onChange={(e) => setSettings({ ...settings, itemsPerPage: parseInt(e.target.value) || 20 })}
              />
              <p className="text-sm text-muted-foreground">
                Number of items to display per page in lists
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh data periodically
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
            {settings.autoRefresh && (
              <div className="space-y-2">
                <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  min="10"
                  max="300"
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) || 30 })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>
              View system status and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Environment</Label>
                <p className="font-medium">{import.meta.env.MODE || 'development'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">API Base URL</Label>
                <p className="font-medium">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {status && (
          <div className={`p-4 rounded-md ${
            status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {status.message}
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

