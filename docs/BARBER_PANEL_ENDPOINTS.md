# Barber Panel – Required Endpoints

Analysis of the **CutChee Barber Panel** (`src-front/barber`) vs backend API in `src-back`.

---

## Already Integrated ✓

| Screen/Component | Endpoint | Method | Notes |
|------------------|----------|--------|-------|
| LoginScreen | `/otp/send` | POST | Sends OTP to phone |
| LoginScreen | `/auth/login/otp` | POST | Verify OTP, returns `token`, `refreshToken`, `user`, `isNewUser`; use `userType: 'barber'` |
| ProfileSetupScreen | `/barber/profile` | POST | FormData: `name`, `gender`, `address`, `description`, `profileImage` |
| AvatarUpload | `/barber/profile` | POST | FormData for profile image update |
| firebase.ts | `/notifications/register-token` | POST | FCM token registration |

---

## Backend Endpoints (Available but not used in Barber Panel)

### Auth & Profile
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/barber/profile` | GET | Get barber profile |
| `/barber/profile` | PUT | Edit profile (FormData: profileImage, backgroundImage) |
| `/barber/logout` | POST | Logout barber (refresh token invalidated) |

### Home
| Endpoint | Method | Response Shape | Used In |
|----------|--------|----------------|---------|
| `/barber/home/dashboard` | GET | `{ data: { barberName, barbershopName, barbershopProfileImage, totalCustomers, activeReservations, weeklyRevenue } }` | HomeScreen (mock) |
| `/barber/home/today-appointments` | GET | Today's appointments list | HomeScreen (mock) |

### Appointments
| Endpoint | Method | Params/Body | Used In |
|----------|--------|-------------|---------|
| `/barber/appointments` | GET | Query: `status`, `page`, `limit` | ReservationsScreen (mock) |
| `/barber/appointments/:id/status` | PUT | Body: `{ status: 'pending' \| 'confirmed' \| 'cancelled', note? }` | ReservationsScreen (mock) |

### Customers
| Endpoint | Method | Used In |
|----------|--------|---------|
| `/barber/customers` | GET | CustomersScreen (mock) |

### Profile Sub-pages
| Endpoint | Method | Used In |
|----------|--------|---------|
| `/barber/services` | GET, POST, PUT `/:id` | ProfileScreen → ServicesSubPage (mock) |
| `/barber/working-hours` | GET, POST, PUT | ProfileScreen → EditScheduleScreen (mock) |
| `/barber/coupons` | GET, POST, PUT `/:id` | ProfileScreen → Discounts (mock) |
| `/barber/coupons/:id/send-sms` | POST | ProfileScreen → SendSmsSheet (mock) |
| `/barber/comments` | GET | CustomerReviewsScreen (mock) |

### Wallet
| Endpoint | Method | Used In |
|----------|--------|---------|
| `/barber/wallet/balance` | GET | ProfileScreen → Wallet (mock) |
| `/barber/wallet/withdraw` | POST | ProfileScreen → Wallet (mock) |
| `/barber/wallet/payment-history` | GET | ProfileScreen → Wallet history (mock) |
| `/barber/wallet/deposit` | POST | - |
| `/barber/wallet/transfer` | POST | - |
| `/barber/wallet/lock` | POST | - |
| `/barber/wallet/history` | GET | Transaction history |

---

## Gaps / Not Wired Yet

1. **HomeScreen** – Uses hardcoded `insightData`, `todayAppointments`.  
   Wire to: `GET /barber/home/dashboard`, `GET /barber/home/today-appointments`.

2. **ReservationsScreen** – Uses `initialReservations`.  
   Wire to: `GET /barber/appointments`, `PUT /barber/appointments/:id/status`.

3. **CustomersScreen** – Uses hardcoded `customers`.  
   Wire to: `GET /barber/customers`.

4. **ProfileScreen** – Profile, schedule, services, discounts, wallet use local state.  
   Wire to:
   - `GET /barber/profile`
   - `PUT /barber/profile` (EditProfileScreen)
   - `GET /barber/working-hours`, `PUT /barber/working-hours` (EditScheduleScreen)
   - `GET /barber/services`, `POST /barber/services`, `PUT /barber/services/:id` (ServicesSubPage)
   - `GET /barber/coupons`, `POST /barber/coupons`, `PUT /barber/coupons/:id`, `POST /barber/coupons/:id/send-sms`
   - `GET /barber/wallet/balance`, `POST /barber/wallet/withdraw`, `GET /barber/wallet/payment-history`
   - `GET /barber/comments` (CustomerReviewsScreen)

5. **AddReservationScreen** – Saves locally only.  
   No barber-specific endpoint for manual appointments. Options:
   - Use `POST /appointments` (if backend supports barber-created appointments), or
   - Add a dedicated endpoint like `POST /barber/appointments` for manual reservations.

6. **NotificationsScreen** – Uses hardcoded data.  
   No barber notifications list endpoint in backend.

7. **Logout** – `handleLogout` clears `localStorage` but does not call `POST /barber/logout`.  
   Wire logout to `POST /barber/logout` before clearing tokens.

---

## Auth Flow (Barber)

Barber login flow:

1. `POST /otp/send` with `{ phone }`
2. `POST /auth/login/otp` with `{ phone, otp, userType: 'barber' }`
3. Store `token`, `refreshToken` in `localStorage`
4. Send `Authorization: Bearer {token}` on all barber API requests

All `/barber/*` routes require `authenticateToken` and barber role (`userType === 'barber'`, `req.user.barberId`).

---

## Docs Referenced

- `README.md` – backend overview
- `TEST_API.md` – OTP, auth, files
- `docs/ADMIN_LOGIN_FIXED.md` – auth separation (admin vs customer/barber)
- `src-back/All_Utils/routes/routes.ts` – route definitions
