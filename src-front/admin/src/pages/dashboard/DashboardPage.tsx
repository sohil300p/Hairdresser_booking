import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SystemMetrics } from '../../components/SystemMetrics';
import { WalletSummaryCard } from '../../modules/financial/components/WalletSummaryCard';
import { walletService } from '../../modules/financial/services/wallet.service';
import { transactionsService } from '../../modules/financial/services/transactions.service';
import type { WalletSummary } from '../../modules/financial/types/financial.types';
import { Wallet, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<WalletSummary[]>([]);
  const [recentCount, setRecentCount] = useState<number | null>(null);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);

  const fetchFinancial = async () => {
    try {
      setFinancialLoading(true);
      setFinancialError(null);
      const [summariesData, txData] = await Promise.all([
        walletService.getWalletSummaries(),
        transactionsService.getTransactions({ page: 1, limit: 5 }),
      ]);
      setSummaries(summariesData);
      setRecentCount(txData.pagination.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch financial data';
      setFinancialError(msg);
    } finally {
      setFinancialLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancial();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Logged in as {user?.phone}</p>
      </div>

      {financialLoading && summaries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading financial data...</span>
          </CardContent>
        </Card>
      ) : financialError && summaries.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{financialError}</p>
          </CardContent>
        </Card>
      ) : summaries.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Wallet Summary</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {summaries.map((s) => (
              <WalletSummaryCard key={s.ownerType} summary={s} />
            ))}
          </div>
          {recentCount !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Total transactions: {recentCount}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <SystemMetrics />
    </div>
  );
}

