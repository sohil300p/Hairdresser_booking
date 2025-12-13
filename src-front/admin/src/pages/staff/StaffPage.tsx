import React, { useState, useEffect } from 'react';
import { staffService, Staff } from '../../services/staff.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Search, Users, Phone, Mail, Calendar, Clock, Shield, ShieldCheck } from 'lucide-react';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredStaff(staff);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredStaff(staff.filter(s => 
        s.fullName.toLowerCase().includes(lower) || 
        s.phone.includes(lower) ||
        s.email?.toLowerCase().includes(lower) ||
        s.role.includes(lower)
      ));
    }
  }, [searchQuery, staff]);

  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching staff...');
      const res = await staffService.getAllStaff();
      console.log('📥 Response received:', res);
      
      if (res.success) {
        console.log(`✅ Successfully loaded ${res.admins?.length || 0} staff members`);
        setStaff(res.admins || []);
        setFilteredStaff(res.admins || []);
      } else {
        console.error('❌ Service returned success=false:', res);
        setError('Failed to fetch staff. Please check your permissions.');
      }
    } catch (err: any) {
      console.error('❌ Error fetching staff:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch staff';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Full Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
        <Shield className="h-3 w-3 mr-1" />
        Staff Admin
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage administrators and staff members
          </p>
        </div>
        <button
          onClick={fetchStaff}
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
              placeholder="Search staff by name, phone, email, or role..."
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
          ) : filteredStaff.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No staff members found</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredStaff.length} of {staff.length} staff members
              </div>
              <div className="grid gap-4">
                {filteredStaff.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {member.fullName}
                            </h3>
                            {getRoleBadge(member.role)}
                            {!member.isActive && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {member.phone}
                            </div>
                            {member.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {member.email}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Joined: {formatDate(member.createdAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Last login: {formatDate(member.lastLoginAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">
                          {member.role === 'admin' ? 'Full Access' : 'Limited Access'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

