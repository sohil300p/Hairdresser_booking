# Database Schema & Authentication + Transaction API Development

## Phase 1: Database Schema Refinement

### 1.1 Fix Schema Issues

- Update `Customer` model to ensure proper structure for authentication
- Update `Barber` model - make `userRefId` required (not optional) when barber is created
- Add missing `CommentRate` model (referenced but not defined)
- Ensure phone uniqueness across Customer and Barber tables
- Add indexes for performance

### 1.2 Add Package/Coupon Models

- Create `Package` model for sellable service packages
- Enhance `Coupon` model if needed
- Add `PackagePurchase` model to track user package purchases
- Link packages to appointments/services

### 1.3 Revenue Sharing Configuration

- Create `RevenueShareConfig` model (class-oriented, configurable)
- Store platform percentage vs barber percentage
- Support different rates for different service types

### Files to modify:

- `prisma/schema.prisma` - Add missing models, fix relationships

## Phase 2: Authentication System

### 2.1 Update OTP Service

- Modify `src-back/OTP/otp.service.ts` to use `Customer` model instead of `user`
- Add user type selection (customer/barber) and gender on first registration
- Update OTP verification to create Customer record, and Barber record if needed

### 2.2 Create Password Login Service

- Create `src-back/auth/login.service.ts` with:
- `loginWithPassword()` - phone + password login
- `registerWithPassword()` - phone + password registration (asks userType, gender)
- Support both Customer and Barber authentication

### 2.3 Create Login Controllers

- Create `src-back/auth/login.controller.ts` with:
- `POST /api/auth/login/password` - password-based login
- `POST /api/auth/login/otp` - OTP-based login (modify existing)
- Both endpoints handle automatic registration

### 2.4 Update Auth Middleware

- Update `src-back/auth/auth.middleware.ts` to work with Customer/Barber models
- Support role-based access control

### 2.5 Update JWT Utils

- Update `src-back/utils/jwt.ts` to handle Customer/Barber roles properly
- JWT payload should include userType (customer/barber) and userId

### Files to create/modify:

- `src-back/auth/login.service.ts` (new)
- `src-back/auth/login.controller.ts` (new)
- `src-back/auth/login.type.ts` (new)
- `src-back/OTP/otp.service.ts` (modify)
- `src-back/OTP/otp.controller.ts` (modify)
- `src-back/auth/auth.service.ts` (modify - use Customer/Barber)
- `src-back/auth/auth.middleware.ts` (modify)
- `src-back/routes/routes.ts` (add new routes)

## Phase 3: Transaction & Wallet System

### 3.1 Create Transaction Service

- Create `src-back/Transaction/transaction.service.ts` with:
- `getWalletBalance()` - get balance for customer/barber/barbershop
- `deposit()` - external deposit (creates ExternalTransaction + InternalTransaction)
- `withdraw()` - withdrawal request
- `transfer()` - internal wallet transfer
- `getTransactionHistory()` - paginated transaction history
- `lockFundsForAppointment()` - lock funds for appointment deposit

### 3.2 Create Package Service

- Create `src-back/Package/package.service.ts` with:
- `getAvailablePackages()` - list sellable packages
- `purchasePackage()` - purchase package (creates transaction)
- `getUserPackages()` - get user's purchased packages

### 3.3 Create Coupon Service

- Create `src-back/Coupon/coupon.service.ts` with:
- `validateCoupon()` - validate coupon code
- `applyCoupon()` - apply coupon to transaction
- `getUserCoupons()` - get available coupons for user

### 3.4 Create Revenue Share Service

- Create `src-back/RevenueShare/revenue-share.service.ts` with:
- `calculateRevenueShare()` - calculate platform vs barber share
- `getRevenueShareConfig()` - get current configuration
- Class-oriented design for easy future changes

### 3.5 Create Transaction Controllers

- Create `src-back/Transaction/transaction.controller.ts` with:
- `GET /api/transactions/wallet/balance` - get wallet balance
- `POST /api/transactions/deposit` - deposit funds
- `POST /api/transactions/withdraw` - withdraw funds
- `POST /api/transactions/transfer` - transfer between wallets
- `GET /api/transactions/history` - transaction history
- `POST /api/transactions/lock` - lock funds for appointment

### 3.6 Create Package Controllers

- Create `src-back/Package/package.controller.ts` with:
- `GET /api/packages` - list available packages
- `POST /api/packages/purchase` - purchase package
- `GET /api/packages/my-packages` - user's packages

### 3.7 Create Coupon Controllers

- Create `src-back/Coupon/coupon.controller.ts` with:
- `POST /api/coupons/validate` - validate coupon
- `GET /api/coupons/available` - get available coupons

### Files to create:

- `src-back/Transaction/transaction.service.ts`
- `src-back/Transaction/transaction.controller.ts`
- `src-back/Transaction/transaction.type.ts`
- `src-back/Package/package.service.ts`
- `src-back/Package/package.controller.ts`
- `src-back/Package/package.type.ts`
- `src-back/Coupon/coupon.service.ts`
- `src-back/Coupon/coupon.controller.ts`
- `src-back/Coupon/coupon.type.ts`
- `src-back/RevenueShare/revenue-share.service.ts`
- `src-back/RevenueShare/revenue-share.type.ts`

## Phase 4: Database Migration & Updates

### 4.1 Generate Prisma Client

- Run `npx prisma generate` after schema changes

### 4.2 Create Migration

- Create migration for new models and schema changes
- Ensure data integrity with proper foreign keys

## Implementation Notes

- All timestamps use BigInt (milliseconds) as per existing schema
- Wallet balance is cached but single source of truth is InternalTransaction aggregation
- Phone numbers must be unique across Customer and Barber tables
- Registration flow: Ask userType (customer/barber) and gender on first login
- Transaction system supports external (gateway) and internal (wallet) transactions
- Revenue sharing is configurable and class-oriented for future changes
- Packages can be linked to services and have deposit/full payment options