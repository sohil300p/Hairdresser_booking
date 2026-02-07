# Admin Financial API

## Overview

All `/admin/financial/*` routes require admin authentication (`authenticateAdmin`). Use `Authorization: Bearer {admin_token}`.

## Response Shape

All endpoints return `{ success: boolean, data: T }`. On error: `{ success: false, message: string }`.

## Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/admin/financial/wallets` | GET | Aggregated wallet summaries by owner type |
| `/admin/financial/transactions` | GET | Paginated transactions with filters |
| `/admin/financial/metrics` | GET | Financial metrics (totals, counts) |

### GET /admin/financial/wallets

Response: `{ success: true, data: WalletSummary[] }`

```ts
WalletSummary { ownerType: 'customer'|'barber'|'barbershop', totalBalance: number, count: number }
```

### GET /admin/financial/transactions

Query params: `ownerType`, `type`, `from`, `to`, `page`, `limit`

Response: `{ success: true, data: { transactions: Transaction[], pagination: { page, limit, total, totalPages } } }`

### GET /admin/financial/metrics

Response: `{ success: true, data: FinancialMetrics }`

```ts
FinancialMetrics { totalBalances: Record<ownerType, number>, totalTransactionCount: number, recentTransactionCount: number }
```
