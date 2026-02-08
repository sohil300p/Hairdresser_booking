import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Wallet, Users, Building2, Store, Banknote } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import type { WalletSummary } from '../types/financial.types';

const ownerLabels: Record<string, string> = {
  customer: 'Customers',
  barber: 'Barbers',
  barbershop: 'Barbershops',
  system: 'System (Platform)',
};

const ownerIcons: Record<string, React.ReactNode> = {
  customer: <Users className="h-5 w-5" />,
  barber: <Store className="h-5 w-5" />,
  barbershop: <Building2 className="h-5 w-5" />,
  system: <Banknote className="h-5 w-5" />,
};

interface WalletSummaryCardProps {
  summary: WalletSummary;
}

export function WalletSummaryCard({ summary }: WalletSummaryCardProps) {
  const label = ownerLabels[summary.ownerType] ?? summary.ownerType;
  const icon = ownerIcons[summary.ownerType] ?? <Wallet className="h-5 w-5" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(summary.totalBalance)}</div>
        <p className="text-xs text-muted-foreground">
          {summary.count} wallet{summary.count !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
