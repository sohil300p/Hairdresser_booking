# Appointment System Development Plan

## Current State Analysis

### ✅ Database Schema (Well Designed)

- Appointment model with all necessary fields
- Scheduling models (BarberSchedule, BarberTimeOff, BarbershopSchedule)
- Multi-staff support (AppointmentBarber join table)
- Service addons (AppointmentAddon)
- Payment locking mechanism
- Status tracking (AppointmentLog)
- Reminders system

### ❌ Missing Backend Implementation

- No Appointment service/controller
- No availability checking service
- No appointment CRUD operations
- No status management workflow
- No cancellation with refund logic

### ⚠️ Frontend (Partial Implementation)

- UI exists but uses local state only
- No API integration
- No real availability checking
- Hardcoded time slots

## Questions Before Implementation

1. **Appointment Creation Rules:**

- Should appointments require `barberId` OR `barbershopId`, or can both be optional?
- Can a customer book at barbershop level without selecting specific barber?

2. **Availability Checking:**

- Should we check: BarberSchedule + BarberTimeOff + Existing Appointments + BarbershopSchedule?
- What's the minimum booking advance time? (e.g., 1 hour before)
- Should we support same-day bookings?

3. **Cancellation Policy:**

- Frontend mentions: "Cancel >3 hours before: 100% refund, ≤3 hours: 25% penalty"
- Should this be configurable per barbershop/barber?
- Who can cancel: customer, barber, or both?

4. **Status Flow:**

- Should appointments be auto-confirmed or require barber approval?
- Status flow: `pending → confirmed → paid → completed/cancelled`?
- Can barbers reject appointments?

5. **Multi-Staff Appointments:**

- Can customers select multiple barbers for one appointment?
- How should availability work for multi-staff?

6. **Payment & Completion:**

- When is payment released to barber? (on completion, or after X hours?)
- Should we support partial payments (deposit + final payment)?

7. **Rescheduling:**

- Should customers be able to reschedule appointments?
- Any restrictions on rescheduling (e.g., max 2 times)?

## Proposed Implementation Plan

### Phase 1: Availability Service

- Create availability checking service
- Check barber schedules, time off, existing appointments
- Check barbershop schedules
- Generate available time slots for a given date
- Handle service duration calculations

### Phase 2: Appointment Service (CRUD)

- Create appointment (with validation)
- Get appointment by ID
- List appointments (customer/barber/barbershop views)
- Update appointment status
- Cancel appointment with refund calculation
- Reschedule appointment

### Phase 3: Appointment Controller & Routes

- POST /api/appointments - Create appointment
- GET /api/appointments/:id - Get appointment details
- GET /api/appointments - List appointments (with filters)
- PUT /api/appointments/:id/status - Update status
- POST /api/appointments/:id/cancel - Cancel appointment
- POST /api/appointments/:id/reschedule - Reschedule
- GET /api/appointments/availability - Check availability

### Phase 4: Frontend Integration

- Create appointment service in frontend
- Update BookingPage to use API
- Real-time availability checking
- Update MyBookingsPage to fetch from API
- Handle status updates and cancellations

### Phase 5: Status Management & Workflow

- Implement status transition logic
- Create appointment logs on status changes
- Handle payment release on completion
- Send notifications on status changes

### Phase 6: Advanced Features

- Multi-staff appointment support
- Service addons in booking
- Coupon application during booking
- Package usage during booking
- Appointment reminders

## Implementation Details

### Availability Algorithm

1. Get barber's weekly schedule for requested weekday
2. Check barber's time off periods
3. Get existing appointments for barber on requested date
4. Check barbershop schedule
5. Calculate available slots considering service duration
6. Return available time slots

### Cancellation Refund Logic

- Calculate hours until appointment
- Apply refund policy (configurable)
- Create refund transaction
- Update appointment status
- Log cancellation

### Status Transitions

- `pending` → `confirmed` (auto or manual)
- `confirmed` → `paid` (after payment lock)
- `paid` → `completed` (barber marks complete)
- `paid` → `cancelled` (with refund)
- Any status → `no_show` (if customer doesn't show)

## ZarrinPal Payment Gateway Integration

### Phase 7: ZarrinPal Integration

- Create ZarrinPal service for payment requests and verification
- Integrate with ExternalTransaction and InternalTransaction
- Handle payment callback and verification
- Update deposit service to use ZarrinPal
- Support sandbox and production modes

### ZarrinPal Flow:

1. **Payment Request**: Customer initiates payment → Create ExternalTransaction (pending) → Call ZarrinPal API → Get Authority → Return payment URL
2. **Payment Callback**: User completes payment → ZarrinPal redirects to callback URL → Verify payment → Update ExternalTransaction status → Create InternalTransaction (if success)
3. **Payment Verification**: Verify with ZarrinPal using Authority and Amount → Get RefID → Update transaction status

### Implementation Details:

- Create `src-back/PaymentGateway/zarrinpal.service.ts`
- Create `src-back/PaymentGateway/payment-gateway.type.ts`
- Create callback controller for ZarrinPal redirects
- Update deposit service to handle online payments via ZarrinPal
- Add environment variables for ZarrinPal MerchantID and CallbackURL
- Support both sandbox and production environments

## MeliPayamak SMS Integration for OTP

### Phase 7: MeliPayamak OTP Integration

- Create MeliPayamak SMS service
- Integrate with existing OTP service  
- Send actual SMS via MeliPayamak API
- Support pattern-based SMS (template) or simple SMS
- Handle SMS sending errors gracefully
- Fallback to console.log in development mode

### MeliPayamak Implementation:

- Create `src-back/SMS/melipayamak.service.ts`
- Create `src-back/SMS/sms.type.ts`
- Update `src-back/OTP/otp.service.ts` to use MeliPayamak
- Use REST API directly (axios) or Node.js package if available
- Use environment variables from .env (already configured: MELIPAYAMAK_USERNAME, MELIPAYAMAK_PASSWORD, MELIPAYAMAK_FROM)
- Support pattern-based SMS for OTP templates
- Handle rate limiting and error responses
- Log SMS status for monitoring

### SMS Flow:

1. Generate OTP → Store in Redis
2. Call MeliPayamak API to send SMS with OTP
3. Handle success/failure responses
4. Log SMS status (sent/failed) for monitoring
5. In development: fallback to console.log if API fails

### MeliPayamak API Endpoints:

- Simple SMS: `https://rest.payamak-panel.com/api/SendSimpleSMS/SendSimpleSMS`
- Pattern SMS: `https://rest.payamak-panel.com/api/SendByBaseNumber/SendByBaseNumber` (for templates)

Please answer the appointment questions above, and I'll implement the appointment system, MeliPayamak OTP integration, and ZarrinPal payment gateway integration.