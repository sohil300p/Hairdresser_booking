import React, { useState, useEffect } from 'react';
import { appointmentsService, Appointment } from '../../services/appointments.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Search, Calendar, Clock, DollarSign, User, Scissors, Building2, Package } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    let filtered = appointments;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.customerName?.toLowerCase().includes(lower) || 
        apt.customerPhone.includes(lower) ||
        apt.barberName?.toLowerCase().includes(lower) ||
        apt.barbershopName?.toLowerCase().includes(lower) ||
        apt.serviceName?.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  }, [searchQuery, statusFilter, appointments]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentsService.getAllAppointments();
      if (res.success) {
        const apts = (res.appointments || []).map(apt => ({
          ...apt,
          startTime: typeof apt.startTime === 'string' ? apt.startTime : String(apt.startTime),
          endTime: typeof apt.endTime === 'string' ? apt.endTime : String(apt.endTime),
        }));
        setAppointments(apts);
        setFilteredAppointments(apts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const num = BigInt(timestamp);
      return new Date(Number(num)).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all appointments
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments by customer, barber, barbershop, or service..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    statusFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : error ? (
            <div className="text-center p-8 text-red-600">{error}</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No appointments found</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredAppointments.length} of {appointments.length} appointments
              </div>
              <div className="grid gap-4">
                {filteredAppointments.map((apt) => (
                  <Card key={apt.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(apt.status)}`}>
                              {apt.status.toUpperCase().replace('_', ' ')}
                            </span>
                            <span className="text-sm text-muted-foreground">ID: #{apt.id}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <User className="h-4 w-4" />
                                Customer
                              </div>
                              <div className="font-medium">{apt.customerName || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{apt.customerPhone}</div>
                            </div>
                            {apt.barberName && (
                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Scissors className="h-4 w-4" />
                                  Barber
                                </div>
                                <div className="font-medium">{apt.barberName}</div>
                              </div>
                            )}
                            {apt.barbershopName && (
                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Building2 className="h-4 w-4" />
                                  Barbershop
                                </div>
                                <div className="font-medium">{apt.barbershopName}</div>
                              </div>
                            )}
                            {apt.serviceName && (
                              <div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Package className="h-4 w-4" />
                                  Service
                                </div>
                                <div className="font-medium">{apt.serviceName}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Calendar className="h-4 w-4" />
                              Start
                            </div>
                            <div className="font-medium">{formatDate(apt.startTime)}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Clock className="h-4 w-4" />
                              End
                            </div>
                            <div className="font-medium">{formatDate(apt.endTime)}</div>
                          </div>
                          {(apt.priceTotal || apt.paidAmount) && (
                            <div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <DollarSign className="h-4 w-4" />
                                Payment
                              </div>
                              <div className="font-medium">
                                {formatCurrency(apt.paidAmount || apt.priceTotal)}
                              </div>
                            </div>
                          )}
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

