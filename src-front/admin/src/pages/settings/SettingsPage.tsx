import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Save, RefreshCw, Bell, Server, Image, Upload, X } from 'lucide-react';
import { getDefaultImages, updateDefaultImages, type DefaultImages, type UpdateDefaultImagesPayload } from '../../services/settings.service';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    autoRefresh: false,
    refreshInterval: 30,
    itemsPerPage: 20,
  });
  const [defaultImages, setDefaultImages] = useState<DefaultImages>({
    defaultBarberProfileImageUrl: '',
    defaultBarberHeaderImageUrl: '',
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    getDefaultImages()
      .then(setDefaultImages)
      .catch(() => {});
  }, []);

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

  const handleSaveDefaultImages = async () => {
    setIsSavingImages(true);
    setStatus(null);
    try {
      const payload: UpdateDefaultImagesPayload = {
        defaultBarberProfileImageUrl: defaultImages.defaultBarberProfileImageUrl || undefined,
        defaultBarberHeaderImageUrl: defaultImages.defaultBarberHeaderImageUrl || undefined,
        profileImageFile: profileFile ?? undefined,
        headerImageFile: headerFile ?? undefined,
      };
      const updated = await updateDefaultImages(payload);
      setDefaultImages(updated);
      setProfileFile(null);
      setHeaderFile(null);
      if (profileInputRef.current) profileInputRef.current.value = '';
      if (headerInputRef.current) headerInputRef.current.value = '';
      setStatus({ type: 'success', message: 'Default images saved. They will be used when a barber has no profile or header image.' });
    } catch {
      setStatus({ type: 'error', message: 'Failed to save default images.' });
    } finally {
      setIsSavingImages(false);
    }
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
              <Image className="h-5 w-5" />
              Default Images
            </CardTitle>
            <CardDescription>
              Images shown when a barber has not set a profile picture or header banner. Used in barber and user apps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultBarberProfileImageUrl">Default profile image</Label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                  {profileFile ? (
                    <img src={URL.createObjectURL(profileFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : defaultImages.defaultBarberProfileImageUrl ? (
                    <img src={defaultImages.defaultBarberProfileImageUrl} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      ref={profileInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => profileInputRef.current?.click()}>
                      <Upload className="mr-1 h-4 w-4" />
                      Upload
                    </Button>
                    {profileFile && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setProfileFile(null); profileInputRef.current && (profileInputRef.current.value = ''); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    id="defaultBarberProfileImageUrl"
                    type="url"
                    placeholder="Or enter URL (e.g. https://...)"
                    value={defaultImages.defaultBarberProfileImageUrl}
                    onChange={(e) => setDefaultImages((prev) => ({ ...prev, defaultBarberProfileImageUrl: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Shown as barber/shop avatar when not specified
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultBarberHeaderImageUrl">Default header / banner image</Label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-32 h-20 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                  {headerFile ? (
                    <img src={URL.createObjectURL(headerFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : defaultImages.defaultBarberHeaderImageUrl ? (
                    <img src={defaultImages.defaultBarberHeaderImageUrl} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      ref={headerInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => setHeaderFile(e.target.files?.[0] ?? null)}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => headerInputRef.current?.click()}>
                      <Upload className="mr-1 h-4 w-4" />
                      Upload
                    </Button>
                    {headerFile && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setHeaderFile(null); headerInputRef.current && (headerInputRef.current.value = ''); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    id="defaultBarberHeaderImageUrl"
                    type="url"
                    placeholder="Or enter URL (e.g. https://...)"
                    value={defaultImages.defaultBarberHeaderImageUrl}
                    onChange={(e) => setDefaultImages((prev) => ({ ...prev, defaultBarberHeaderImageUrl: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Shown at top of barber profile when not specified
              </p>
            </div>
            <Button onClick={handleSaveDefaultImages} disabled={isSavingImages}>
              <Save className="mr-2 h-4 w-4" />
              {isSavingImages ? 'Saving...' : 'Save default images'}
            </Button>
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

