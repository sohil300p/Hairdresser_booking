import React, { useState, useEffect } from 'react';
import {
  barbersService,
  Barber,
  Barbershop,
  BarberAppointment,
  BarbershopServiceItem,
} from '../../services/barbers.service';
import { notificationService } from '../../services/notification.service';
import { formatCurrency } from '../../modules/financial/utils/formatCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import {
  Search,
  Scissors,
  Phone,
  Mail,
  Wallet,
  Building2,
  Calendar,
  Percent,
  Save,
  FileText,
  ChevronDown,
  ChevronRight,
  Trash2,
  Banknote,
  List,
  Bell,
  Send,
} from 'lucide-react';

const TIER_LABELS: Record<number, string> = {
  24: '24h+ before',
  12: '12h before',
  1: '1h before',
  0: '<1h before',
};

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commissionEdits, setCommissionEdits] = useState<Record<number, string>>({});
  const [savingShopId, setSavingShopId] = useState<number | null>(null);
  const [expandedBarberId, setExpandedBarberId] = useState<number | null>(null);
  const [appointmentsByBarber, setAppointmentsByBarber] = useState<Record<number, BarberAppointment[]>>({});
  const [servicesByShop, setServicesByShop] = useState<Record<number, BarbershopServiceItem[]>>({});
  const [loadingBarberId, setLoadingBarberId] = useState<number | null>(null);
  const [clearingReservationsBarberId, setClearingReservationsBarberId] = useState<number | null>(null);
  const [clearingFinancialBarberId, setClearingFinancialBarberId] = useState<number | null>(null);
  const [notifyBarberId, setNotifyBarberId] = useState<number | null>(null);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const loadBarberAppointments = async (barberId: number) => {
    setLoadingBarberId(barberId);
    try {
      const res = await barbersService.getBarberAppointments(barberId);
      if (res.success && res.appointments) {
        setAppointmentsByBarber((prev) => ({ ...prev, [barberId]: res.appointments! }));
      }
    } finally {
      setLoadingBarberId(null);
    }
  };

  const loadShopServices = async (shopId: number) => {
    if (servicesByShop[shopId]) return;
    try {
      const res = await barbersService.getBarbershopServices(shopId);
      if (res.success && res.services) {
        setServicesByShop((prev) => ({ ...prev, [shopId]: res.services! }));
      }
    } catch (_) {}
  };

  const handleClearReservations = async (barberId: number) => {
    if (!confirm('Cancel all future reservations for this barber?')) return;
    setClearingReservationsBarberId(barberId);
    try {
      const res = await barbersService.clearBarberReservations(barberId);
      if (res.success) {
        await fetchBarbers();
        setAppointmentsByBarber((prev) => ({ ...prev, [barberId]: [] }));
      }
    } finally {
      setClearingReservationsBarberId(null);
    }
  };

  const handleClearFinancial = async (barberId: number) => {
    if (!confirm('Set this barber’s wallet balance to zero? This cannot be undone.')) return;
    setClearingFinancialBarberId(barberId);
    try {
      const res = await barbersService.clearBarberFinancial(barberId);
      if (res.success) await fetchBarbers();
    } finally {
      setClearingFinancialBarberId(null);
    }
  };

  const handleSendNotification = async (barberId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyBody.trim()) return;
    setNotifySending(true);
    setNotifyStatus(null);
    try {
      const res = await notificationService.sendNotification({
        userId: barberId,
        userType: 'barber',
        title: notifyTitle.trim(),
        body: notifyBody.trim(),
      });
      if (res.success) {
        setNotifyStatus({ type: 'success', message: res.sentCount != null ? `Sent to ${res.sentCount} device(s)` : 'Sent' });
        setNotifyTitle('');
        setNotifyBody('');
      } else {
        setNotifyStatus({ type: 'error', message: res.message ?? 'Failed to send' });
      }
    } catch (err: any) {
      setNotifyStatus({ type: 'error', message: err.message ?? 'Failed to send notification' });
    } finally {
      setNotifySending(false);
    }
  };

  const handleSaveCommission = async (shop: Barbershop) => {
    const val = commissionEdits[shop.id] ?? String(shop.platformCommissionPercent ?? 20);
    const num = parseInt(val, 10);
    if (Number.isNaN(num) || num < 0 || num > 100) return;
    setSavingShopId(shop.id);
    try {
      await barbersService.setBarbershopCommission(shop.id, num);
      await fetchBarbers();
      setCommissionEdits((prev) => {
        const next = { ...prev };
        delete next[shop.id];
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save commission');
    } finally {
      setSavingShopId(null);
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {barber.fullName ?? '—'}
                            </h3>
                            <span className="text-sm font-medium text-muted-foreground">Name</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{barber.phone ?? '—'}</span>
                            <span className="text-muted-foreground">Phone</span>
                          </div>
                          {barber.specialization && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {barber.specialization}
                              {barber.experienceYears != null && ` • ${barber.experienceYears} years experience`}
                            </p>
                          )}
                          {barber.email && (
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {barber.email}
                            </div>
                          )}
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
                          <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(barber.walletBalance)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Wallet className="h-3 w-3" />
                            Balance
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      {notifyBarberId === barber.id ? (
                        <form
                          onSubmit={(e) => handleSendNotification(barber.id, e)}
                          className="space-y-3"
                        >
                          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                            <Bell className="h-4 w-4" />
                            Send notification
                          </h4>
                          <div className="grid gap-2">
                            <Label htmlFor={`notify-title-${barber.id}`}>Title</Label>
                            <Input
                              id={`notify-title-${barber.id}`}
                              value={notifyTitle}
                              onChange={(e) => setNotifyTitle(e.target.value)}
                              placeholder="Notification title"
                              required
                              className="text-sm"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`notify-body-${barber.id}`}>Body</Label>
                            <Input
                              id={`notify-body-${barber.id}`}
                              value={notifyBody}
                              onChange={(e) => setNotifyBody(e.target.value)}
                              placeholder="Notification message"
                              required
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={notifySending}
                              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                            >
                              {notifySending ? '...' : <><Send className="h-4 w-4" /> Send</>}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNotifyBarberId(null);
                                setNotifyTitle('');
                                setNotifyBody('');
                                setNotifyStatus(null);
                              }}
                              className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted"
                            >
                              Cancel
                            </button>
                            {notifyStatus && (
                              <span className={notifyStatus.type === 'success' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                                {notifyStatus.message}
                              </span>
                            )}
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setNotifyBarberId(barber.id);
                            setNotifyTitle('');
                            setNotifyBody('');
                            setNotifyStatus(null);
                          }}
                          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                          <Bell className="h-4 w-4" />
                          Send notification
                        </button>
                      )}
                    </div>
                    {barber.barbershops && barber.barbershops.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                          <Percent className="h-4 w-4" />
                          Platform Commission (مدیریت مالی)
                        </h4>
                        {barber.barbershops.map((shop) => (
                          <div key={shop.id} className="space-y-3">
                            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                              <span className="text-sm font-medium flex-1">{shop.name}</span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  className="w-20 h-9 text-sm"
                                  placeholder={String(shop.platformCommissionPercent ?? 20)}
                                  value={commissionEdits[shop.id] ?? ''}
                                  onChange={(e) =>
                                    setCommissionEdits((prev) => ({ ...prev, [shop.id]: e.target.value }))
                                  }
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                                <button
                                  onClick={() => handleSaveCommission(shop)}
                                  disabled={savingShopId === shop.id}
                                  className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                                >
                                  {savingShopId === shop.id ? '...' : <><Save className="h-4 w-4" /> Save</>}
                                </button>
                              </div>
                            </div>
                            {(shop.reservationPaymentPercent != null || shop.cancellationPolicy || (shop.cancellationTiers && shop.cancellationTiers.length > 0)) && (
                              <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <div className="font-medium text-muted-foreground mb-1">Reservation rules (read-only)</div>
                                  {shop.reservationPaymentPercent != null && (
                                    <p>Payment at booking: {shop.reservationPaymentPercent}%</p>
                                  )}
                                  {shop.cancellationPolicy && (
                                    <p>Cancellation: {shop.cancellationPolicy === 'not_accepted' ? 'Not accepted' : 'Tiered'}</p>
                                  )}
                                  {shop.cancellationTiers && shop.cancellationTiers.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                      {[...shop.cancellationTiers]
                                        .sort((a, b) => b.minHoursBefore - a.minHoursBefore)
                                        .map((t) => (
                                          <div key={t.minHoursBefore} className="flex justify-between gap-2">
                                            <span>{TIER_LABELS[t.minHoursBefore] ?? `${t.minHoursBefore}h before`}</span>
                                            <span>{t.feePercent}% fee</span>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => {
                          const next = expandedBarberId === barber.id ? null : barber.id;
                          setExpandedBarberId(next);
                          if (next === barber.id) loadBarberAppointments(barber.id);
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        {expandedBarberId === barber.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        Reservations, Services & Financial
                      </button>
                      {expandedBarberId === barber.id && (
                        <div className="mt-3 space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold flex items-center gap-1">
                                <List className="h-4 w-4" />
                                Reservations
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClearReservations(barber.id)}
                                disabled={clearingReservationsBarberId === barber.id}
                              >
                                {clearingReservationsBarberId === barber.id ? '...' : <><Trash2 className="h-4 w-4 mr-1" /> Clear future</>}
                              </Button>
                            </div>
                            {loadingBarberId === barber.id ? (
                              <p className="text-sm text-muted-foreground">Loading...</p>
                            ) : (appointmentsByBarber[barber.id]?.length ?? 0) === 0 ? (
                              <p className="text-sm text-muted-foreground">No appointments</p>
                            ) : (
                              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                {(appointmentsByBarber[barber.id] ?? []).slice(0, 20).map((a) => (
                                  <li key={a.id} className="flex justify-between gap-2 py-1 border-b border-muted/50 last:border-0">
                                    <span>{new Date(a.startTime).toLocaleString()} — {a.serviceName ?? '—'} ({a.status})</span>
                                    <span>{a.customerName ?? a.customerPhone} {a.priceTotal != null ? formatCurrency(a.priceTotal) : ''}</span>
                                  </li>
                                ))}
                                {(appointmentsByBarber[barber.id]?.length ?? 0) > 20 && (
                                  <li className="text-muted-foreground">+ {(appointmentsByBarber[barber.id]!.length - 20)} more</li>
                                )}
                              </ul>
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-semibold flex items-center gap-1 mb-2">
                              <Banknote className="h-4 w-4" />
                              Financial — Balance: {formatCurrency(barber.walletBalance)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClearFinancial(barber.id)}
                              disabled={clearingFinancialBarberId === barber.id}
                              className="text-destructive border-destructive/50 hover:bg-destructive/10"
                            >
                              {clearingFinancialBarberId === barber.id ? '...' : 'Clear balance'}
                            </Button>
                          </div>
                          {barber.barbershops && barber.barbershops.length > 0 && (
                            <div>
                              <span className="text-sm font-semibold block mb-2">Services per shop</span>
                              {barber.barbershops.map((shop) => (
                                <div key={shop.id} className="mb-2">
                                  <button
                                    type="button"
                                    onClick={() => loadShopServices(shop.id)}
                                    className="text-sm font-medium text-primary hover:underline"
                                  >
                                    {shop.name} — {servicesByShop[shop.id] ? `${servicesByShop[shop.id].length} services` : 'Load services'}
                                  </button>
                                  {servicesByShop[shop.id] && (
                                    <ul className="text-sm mt-1 ml-2 space-y-0.5">
                                      {servicesByShop[shop.id].map((s) => (
                                        <li key={s.id}>{s.name} — {s.price != null ? formatCurrency(s.price) : '—'} ({s.estimatedTime} min)</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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

