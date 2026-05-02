# Reservation System API (v1)

Base path: `/api`

All responses are JSON and include at least:

```json
{ "success": true, "message": "..." }
```

## Authentication
- Protected endpoints require `Authorization: Bearer <accessToken>`

---

## Availability (policy-aware)
### `GET /appointments/availability`
Query:
- `date` (required): `YYYY-MM-DD`
- `serviceId` (optional): number
- `barberId` (optional): number
- `barbershopId` (optional): number

Notes:
- Uses effective reservation policy to apply: `minAdvanceMinutes`, `slotGranularityMinutes`, and buffers.

Response (200):

```json
{
  "success": true,
  "message": "زمان‌های موجود با موفقیت دریافت شد",
  "date": "2026-05-01",
  "availableSlots": [
    { "time": "09:00", "available": true },
    { "time": "09:30", "available": false }
  ]
}
```

---

## Appointments / Reservations
### `POST /appointments` (customer)
Body:
- `date` (required): `YYYY-MM-DD`
- `time` (required): `HH:MM`
- `serviceId` (required): number
- `paymentMethod` (required): `wallet | online | card | cash`
- `barberId` or `barbershopId` (one required)
- `addonIds` (optional): number[]
- `couponCode` (optional): string
- `locationType` (optional): `customer_location | barbershop_fixed`
- `notes` (optional): string

Response (201):

```json
{
  "success": true,
  "message": "رزرو با موفقیت ایجاد شد",
  "appointmentId": 123,
  "paymentUrl": "https://www.zarinpal.com/pg/StartPay/...",
  "authority": "A0000000000000000000000000000000"
}
```

### `GET /appointments` (customer or barber)
Query filters:
- `status`, `startDate`, `endDate`, `page`, `limit`

### `GET /appointments/:id`

### `POST /appointments/:id/cancel`
Body (optional):
- `reason`: string

Response includes refund info when applicable.

### `POST /appointments/:id/reschedule`
Body:
- `date` (required): `YYYY-MM-DD`
- `time` (required): `HH:MM`

---

## Customer “My Reservations”
### `GET /my-reservations` (customer)
Response groups: `future`, `past`, `cancelled`.

### `POST /my-reservations/:id/cancel` (customer)
Same behavior as appointment cancel, but ensures it’s the customer’s own reservation.

---

## Reservation Policy (Fully customizable)
Effective policy precedence:
`BarberOverride > ServiceOverride > BarbershopOverride > GlobalDefault`

### Admin defaults
- `GET /admin/reservation-policies/default`
- `PUT /admin/reservation-policies/default`

Body fields (all optional):
- `slotGranularityMinutes`
- `minAdvanceMinutes`
- `bufferBeforeMinutes`
- `bufferAfterMinutes`
- `maxBookingsPerSlot`
- `depositPercent`
- `cancellationPolicy`: `not_accepted | tiered`
- `cancellationTiers`: `{ minHoursBefore, feePercent }[]`
- `reminderScheduleMinutes`: number[] (e.g. `[1440, 120]`)

### Barber overrides
- `GET /barber/reservation-policies/effective?serviceId=...&barberId=...`
- `PUT /barber/reservation-policies/barbershop`
- `PUT /barber/reservation-policies/service/:serviceId`
- `PUT /barber/reservation-policies/barber/:barberId`

---

## Notifications
### Device token registration (push)
`POST /notifications/register-token`

Body:
- `fcmToken` (required): string
- `platform` (optional): `android | ios | web`

### Customer in-app notifications
- `GET /notifications/in-app?filter=all|unread|read`
- `PATCH /notifications/in-app/read-all`
- `PATCH /notifications/in-app/:id/read`

### Reservation events (automatic)
On reservation lifecycle events, the backend dispatches **best-effort**:
- In-app notification
- Push notification (FCM) if token exists
- SMS (simple SMS fallback; pattern SMS if configured)

Reminders:
- Reminders are scheduled on appointment creation using the effective policy `reminderScheduleMinutes`.
- Worker is enabled by default; disable via `REMINDER_WORKER_ENABLED=false`.

