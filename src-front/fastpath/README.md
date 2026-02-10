# FastPath - Quick Booking Flow

A streamlined, guest-first booking experience for hairdresser appointments.

## Architecture

FastPath is a standalone React + TypeScript app (Vite) with 4 core pages:

1. **Landing Page** (STEP-0): Choose between "Reserve" or "Follow-up"
2. **Reserve Page**: Multi-step wizard (6 steps) for new bookings
3. **Follow-up Page**: Check existing reservations
4. **Confirmation Page**: Post-payment success screen

## File Structure

```
src-front/fastpath/
├── pages/
│   ├── FastPathLandingPage.tsx    # Entry point (STEP-0)
│   ├── FastPathReservePage.tsx     # Reserve flow (steps 1-6)
│   ├── FastPathFollowUpPage.tsx    # Lookup existing reservations
│   └── ConfirmationPage.tsx        # Post-payment confirmation
├── components/
│   ├── Button.tsx
│   ├── Calendar.tsx
│   ├── Icon.tsx
│   ├── Modal.tsx
│   └── Toast.tsx
├── constants/
│   └── policies.ts                 # Cancellation/refund policies
├── utils/
│   └── api.ts                      # HTTP client
├── App.tsx                         # Router & context
├── types.ts                        # TypeScript types
└── index.tsx                       # Entry point
```

## Reserve Flow (6 Steps)

### Step 1: Salon + Services
- If `?ref=` or `barbershopId` in URL: preselected salon
- Otherwise: search for salon, select, then view services
- Select service to continue

### Step 2: Service + Price + Promo
- Displays selected service and base price
- User can enter coupon code (applied after OTP in step 5)

### Step 3: Date + Time
- Calendar component for date selection
- API call to `/appointments/availability` for time slots
- Select time slot to continue

### Step 4: OTP Authentication
- Bottom-sheet modal for name + phone
- Send OTP: `POST /api/otp/send`
- Verify OTP: `POST /api/auth/login/otp`
- On success: store token + user, auto-advance to step 5

### Step 5: Summary + Policies
- Show full booking summary (salon, service, date, time, price)
- Apply coupon code: `POST /api/coupons/validate` (requires auth)
- Display cancellation/refund policy (from `constants/policies.ts`)
- Required checkbox to acknowledge policies
- "Proceed to payment" button

### Step 6: Payment Gateway
- Create appointment: `POST /api/appointments` returns `paymentUrl`
- Redirect to ZarrinPal (or configured gateway)
- Callback URL: `/payment/success?appointmentId=123` → ConfirmationPage
- On failure: redirect to landing with error toast

## Follow-up Flow

- User enters phone + reservation reference/ID
- API call: `GET /api/reservations/lookup?phone=...&ref=...`
- Display reservation details (read-only) or "not available" message

## Backend Requirements

### Existing APIs (used)
- `GET /api/search?query=...` - Search barbershops
- `GET /api/barbershop/:id/overview` - Get barbershop name
- `GET /api/barbershop/:id/services` - Get services list
- `GET /api/appointments/availability?barbershopId=&date=&serviceId=` - Get time slots
- `POST /api/otp/send` - Send OTP to phone
- `POST /api/auth/login/otp` - Verify OTP and login
- `POST /api/coupons/validate` - Validate coupon code (requires auth)
- `POST /api/appointments` - Create appointment (requires auth)
- `POST /api/payment/request` - Get payment URL (if needed)

### Missing APIs (recommended)
- `GET /api/fastpath/resolve?ref=...` - Resolve fastpath ref to barbershop ID
- `GET /api/reservations/lookup?phone=...&ref=...` - Public reservation lookup (for follow-up)

### Notifications
Backend should send SMS + push to user and salon after successful payment (e.g., in payment verify callback).

## State Management

- **App context**: `user`, `currentPage`, `pageParams`, `toast`, `modal`
- **Reserve state**: Component-level state in `FastPathReservePage` (step, form data, selections)
- **Persistence**: Token + user stored in localStorage after OTP login

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## URL Patterns

- `/` or `?` → Landing page (STEP-0)
- `?ref=ABC123` → Auto-redirect to Reserve page with preselected salon
- `/payment/success?appointmentId=123` → Confirmation page
- `/payment/failed` or `/payment/error` → Landing with error toast

## Development

```bash
cd src-front/fastpath
npm install
npm run dev
```

## Notes

- **No router**: Uses state-based page switching in `App.tsx`
- **No full login/profile**: Guest-first flow, OTP only for booking
- **Mobile-first**: Designed for mobile web (max-width: 448px)
- **Persian (RTL)**: All UI text in Persian, `dir="rtl"`
- **Policies**: Cancellation/refund text in `constants/policies.ts`
