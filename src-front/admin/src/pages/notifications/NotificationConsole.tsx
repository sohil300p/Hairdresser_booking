import React, { useState, useEffect } from 'react';
import { notificationService, NotificationUser } from '../../services/notification.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Bell, Smartphone, Send, Search, Mail, MessageSquare } from 'lucide-react';

export default function NotificationConsole() {
  const [users, setUsers] = useState<NotificationUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<NotificationUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<NotificationUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    body: '',
    dataKey: '',
    dataValue: '',
    blockEmail: true,
    blockSms: true,
  });

  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'customer' | 'barber'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let list = userTypeFilter === 'all' ? users : users.filter((u) => u.userType === userTypeFilter);
    if (!searchQuery) {
      setFilteredUsers(list);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredUsers(list.filter(u => 
        (u.name || '').toLowerCase().includes(lower) || 
        (u.phone || '').includes(lower) ||
        u.userType.includes(lower)
      ));
    }
  }, [searchQuery, users, userTypeFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await notificationService.getUsersWithDevices();
      if (res.success) {
        setUsers(res.users || []);
      } else {
        setStatus({ type: 'error', message: 'Failed to load users' });
      }
    } catch (error: any) {
      console.error('Failed to fetch users', error);
      setStatus({ type: 'error', message: error.message || 'Failed to fetch users' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSending(true);
    setStatus(null);

    try {
      const dataPayload = form.dataKey ? { [form.dataKey]: form.dataValue } : undefined;
      const blockChannels: ('push' | 'email' | 'sms')[] = [];
      if (form.blockEmail) blockChannels.push('email');
      if (form.blockSms) blockChannels.push('sms');

      const result = await notificationService.sendNotification({
        userId: selectedUser.userId,
        userType: selectedUser.userType,
        title: form.title,
        body: form.body,
        data: dataPayload,
        blockChannels: blockChannels.length ? blockChannels : undefined,
      });

      if (result.success) {
        const sentCount = result.sentCount || 0;
        const failureCount = result.failureCount || 0;
        let message = 'Notification sent successfully!';
        if (sentCount > 0 || failureCount > 0) {
          message = `Sent to ${sentCount} device(s)${failureCount > 0 ? `, ${failureCount} failed` : ''}`;
        }
        setStatus({ type: 'success', message });
        setForm({ ...form, title: '', body: '' }); // Reset message but keep data key/value
      } else {
        setStatus({ type: 'error', message: result.message || 'Failed to send notification' });
      }
    } catch (error: any) {
      console.error('Failed to send notification', error);
      setStatus({ type: 'error', message: error.message || 'Failed to send notification' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Console</h1>
          <p className="text-muted-foreground mt-2">
            Send push notifications to barbers and customers with registered devices.
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          Refresh Users
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User List */}
        <Card className="md:col-span-1 h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Target Users (Barbers & Customers)</CardTitle>
            <div className="flex gap-2 mt-2">
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value as 'all' | 'customer' | 'barber')}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="barber">Barbers only</option>
                <option value="customer">Customers only</option>
              </select>
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {isLoading ? (
              <div className="flex justify-center p-4">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                {userTypeFilter === 'barber'
                  ? 'No barbers with registered devices. Barbers appear here after they open the app and allow notifications.'
                  : userTypeFilter === 'customer'
                    ? 'No customers with registered devices.'
                    : 'No users found with devices.'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <button
                    key={`${user.userType}-${user.userId}`}
                    onClick={() => {
                        setSelectedUser(user);
                        setStatus(null);
                    }}
                    className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      selectedUser?.userId === user.userId && selectedUser?.userType === user.userType 
                        ? 'bg-primary/10 border-l-4 border-primary' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate" title={user.name}>{user.name || '—'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        user.userType === 'barber' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.userType}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2" title={user.phone}>
                      <Smartphone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{user.phone || '—'}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Platform: {user.platform} • Last active: {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'N/A'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Composer */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>
              {selectedUser 
                ? `Sending to ${selectedUser.name} (${selectedUser.userType})` 
                : 'Select a user from the list to start'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Special Offer!"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <Input
                    id="body"
                    placeholder="e.g. Get 20% off your next haircut"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Block channels (leave checked to skip)</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.blockEmail}
                        onChange={(e) => setForm({ ...form, blockEmail: e.target.checked })}
                        className="rounded"
                      />
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Block Email
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.blockSms}
                        onChange={(e) => setForm({ ...form, blockSms: e.target.checked })}
                        className="rounded"
                      />
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Block SMS
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">Push is always sent unless blocked. Email/SMS are blocked by default when checked.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataKey">Data Key (Optional)</Label>
                    <Input
                      id="dataKey"
                      placeholder="e.g. link"
                      value={form.dataKey}
                      onChange={(e) => setForm({ ...form, dataKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataValue">Data Value (Optional)</Label>
                    <Input
                      id="dataValue"
                      placeholder="e.g. /profile"
                      value={form.dataValue}
                      onChange={(e) => setForm({ ...form, dataValue: e.target.value })}
                    />
                  </div>
                </div>

                {status && (
                  <div className={`p-3 rounded-md text-sm ${
                    status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {status.message}
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isSending}>
                    {isSending ? 'Sending...' : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Notification
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a user to send a notification</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

