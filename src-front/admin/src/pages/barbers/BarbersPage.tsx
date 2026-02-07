import React, { useState, useEffect } from 'react';
import { barbersService, Barber } from '../../services/barbers.service';
import { formatCurrency } from '../../modules/financial/utils/formatCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Search, Scissors, Phone, Mail, Wallet, Building2, Calendar } from 'lucide-react';

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredBarbers(barbers);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredBarbers(barbers.filter(b => 
        b.fullName?.toLowerCase().includes(lower) || 
        b.phone?.toLowerCase().includes(lower) ||
        b.email?.toLowerCase().includes(lower) ||
        b.specialization?.toLowerCase().includes(lower)
      ));
    }
  }, [searchQuery, barbers]);

  const fetchBarbers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await barbersService.getAllBarbers();
      if (res.success) {
        setBarbers(res.barbers || []);
        setFilteredBarbers(res.barbers || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch barbers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barbers Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all registered barbers
          </p>
        </div>
        <button
          onClick={fetchBarbers}
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
              placeholder="Search barbers by name, phone, email, or specialization..."
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
          ) : filteredBarbers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No barbers found</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredBarbers.length} of {barbers.length} barbers
              </div>
              <div className="grid gap-4">
                {filteredBarbers.map((barber) => (
                  <Card key={barber.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {barber.avatar ? (
                          <img
                            src={barber.avatar}
                            alt={barber.fullName || 'Barber'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Scissors className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {barber.fullName || 'Unnamed Barber'}
                          </h3>
                          {barber.specialization && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {barber.specialization}
                              {barber.experienceYears && ` • ${barber.experienceYears} years experience`}
                            </p>
                          )}
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {barber.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {barber.phone}
                              </div>
                            )}
                            {barber.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {barber.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-primary">
                            {barber.appointmentCount}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Appointments
                          </div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-600">
                            {barber.barbershopCount}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Shops
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(barber.walletBalance)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Wallet className="h-3 w-3" />
                            Balance
                          </div>
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

