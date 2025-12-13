import React, { useState, useEffect } from 'react';
import { usersService, User, OtpStatus } from '../../services/users.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Search, Users as UsersIcon, Phone, Mail, Calendar, Clock, RefreshCw, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStatuses, setOtpStatuses] = useState<Record<string, OtpStatus>>({});
  const [resettingOtp, setResettingOtp] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.fullName?.toLowerCase().includes(lower) || 
        u.phone.includes(lower) ||
        u.email?.toLowerCase().includes(lower)
      ));
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching users...');
      const res = await usersService.getAllUsers();
      console.log('📥 Response received:', res);
      
      if (res.success) {
        console.log(`✅ Successfully loaded ${res.users?.length || 0} users`);
        setUsers(res.users || []);
        setFilteredUsers(res.users || []);
      } else {
        console.error('❌ Service returned success=false:', res);
        setError('Failed to fetch users. Please check your permissions.');
      }
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const handleResetOtp = async (phone: string) => {
    if (!confirm(`Are you sure you want to reset OTP limit for ${phone}?`)) {
      return;
    }

    setResettingOtp(prev => ({ ...prev, [phone]: true }));
    try {
      const result = await usersService.resetOtpLimit(phone);
      if (result.success) {
        alert(`✅ ${result.message}`);
        // Refresh OTP status
        const status = await usersService.getOtpStatus(phone);
        setOtpStatuses(prev => ({ ...prev, [phone]: status }));
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setResettingOtp(prev => ({ ...prev, [phone]: false }));
    }
  };

  const loadOtpStatus = async (phone: string) => {
    try {
      const status = await usersService.getOtpStatus(phone);
      setOtpStatuses(prev => ({ ...prev, [phone]: status }));
    } catch (err) {
      console.error('Failed to load OTP status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all registered customers
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, phone, or email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : error ? (
            <div className="text-center p-8 text-red-600">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="grid gap-4">
                {filteredUsers.map((user) => {
                  const otpStatus = otpStatuses[user.phone];
                  return (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName || 'User'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <UsersIcon className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {user.fullName || 'Unnamed User'}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {user.phone}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => loadOtpStatus(user.phone)}
                                className="h-6 px-2"
                              >
                                <Shield className="h-3 w-3" />
                              </Button>
                            </div>
                            {otpStatus && (
                              <div className={`text-xs px-2 py-1 rounded inline-block ${
                                otpStatus.isBlocked 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                OTP: {otpStatus.attempts || 0}/5 attempts
                                {otpStatus.isBlocked && ' - BLOCKED'}
                              </div>
                            )}
                            {user.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Joined: {formatDate(user.createdAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Last login: {formatDate(user.lastLoginAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {user.appointmentCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Appointments</div>
                        </div>
                        {otpStatus?.isBlocked && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleResetOtp(user.phone)}
                            disabled={resettingOtp[user.phone]}
                            className="w-full"
                          >
                            {resettingOtp[user.phone] ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Resetting...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reset OTP
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )})}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

