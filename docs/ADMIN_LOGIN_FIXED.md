# ✅ Admin Login System - Fixed!

## 🐛 **THE PROBLEM**

Admin panel login was searching in the **Customer table** instead of the **Admin table**!

### What Was Wrong:

1. **Wrong Endpoint**: Admin panel used `/api/auth/login/password` (for customers)
2. **Wrong Table**: Backend `loginWithPasswordService` searched `prisma.customer` table
3. **Wrong Seed**: `prisma/seed.ts` created admins in Customer table
4. **Schema Drift**: `schema.prisma` was out of sync with actual database

---

## ✅ **THE FIX**

### 1. Created Dedicated Admin Login Service

**File:** `src-back/All_Utils/Admin/admin-login.service.ts`

```typescript
export async function adminLoginService(data: AdminLoginRequest) {
  // Searches ONLY in Admin table
  const admin = await prisma.admin.findUnique({
    where: { phone },
  });
  
  // Checks admin role and isActive status
  // Returns admin-specific token
}
```

**Key Features:**
- ✅ Searches **ONLY** in `Admin` table
- ✅ Validates admin is active (`isActive = true`)
- ✅ Creates admin session in `user_sessions` table
- ✅ Returns admin-specific JWT token with `isAdmin: true` flag

---

### 2. Created Admin Login Controller

**File:** `src-back/All_Utils/Admin/admin-login.controller.ts`

```typescript
export async function adminLoginController(req: Request, res: Response) {
  const result = await adminLoginService({ phone, password });
  // Returns 401 for invalid credentials
  // Returns 200 with token for success
}
```

---

### 3. Added Admin Login Route

**File:** `src-back/All_Utils/routes/routes.ts`

```typescript
// NEW: Dedicated admin login endpoint
router.post('/admin/login', adminLoginController);

// OLD: Customer/barber login (kept separate)
router.post('/auth/login/password', loginWithPasswordController);
```

---

### 4. Updated Frontend to Use Admin Endpoint

**File:** `src-front/admin/src/services/auth.service.ts`

```typescript
async loginWithPassword(data: LoginWithPasswordRequest) {
  // ✅ NOW: Use dedicated admin endpoint
  const response = await api.post<LoginResponse>('/admin/login', data);
  
  // ❌ BEFORE: Was using customer endpoint
  // const response = await api.post<LoginResponse>('/auth/login/password', data);
}
```

---

### 5. Fixed Database Seed

**File:** `prisma/seed.ts`

```typescript
//✅ NOW: Creates admins in Admin table
const admin = await prisma.admin.upsert({
  where: { phone: '09999918441' },
  create: {
    phone: '09999918441',
    password: hashedPassword,
    role: 'admin',
    fullName: 'مدیر سیستم',
    email: 'admin@hairdresser.com',
    isActive: true,
  }
});

// ❌ BEFORE: Was creating in Customer table
// await prisma.customer.upsert({ ... })
```

**Now Seeds:**
1. Main Admin (phone: 09999918441, role: admin)
2. Staff Admin (phone: 09999918442, role: staff_admin)
3. 3 Test Customers

---

### 6. Fixed Schema Sync

**Issue:** `schema.prisma` was out of sync with database

**Solution:**
```bash
# Pulled actual database schema
npx prisma db pull

# Regenerated Prisma client
npx prisma generate
```

**Fixed Issues:**
- ✅ Customer table name: `customer` → `customers`
- ✅ Password field: `password` → `password_hash`
- ✅ Timestamp fields: Added `created`, `updated` as BigInt
- ✅ Other field mappings aligned with database

---

## 🎯 **HOW IT WORKS NOW**

### Admin Login Flow:

```
1. Admin opens admin panel (localhost:3003)
   ↓
2. Enters phone (09999918441) + password (admin123456)
   ↓
3. Frontend sends POST to /api/admin/login
   ↓
4. Backend searches Admin table (NOT Customer table)
   ↓
5. Validates password with bcrypt
   ↓
6. Checks isActive = true
   ↓
7. Generates JWT token with { userType: 'admin', isAdmin: true }
   ↓
8. Creates session in user_sessions table (adminId field)
   ↓
9. Returns token + admin user data
   ↓
10. Frontend stores token + navigates to dashboard
```

---

## 📊 **DATABASE STRUCTURE**

### Admin Table:
```sql
CREATE TABLE `admin` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `full_name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) UNIQUE NOT NULL,
  `email` VARCHAR(191) UNIQUE,
  `password` VARCHAR(191) NOT NULL,  -- hashed with bcrypt
  `avatar` VARCHAR(191),
  `role` ENUM('admin', 'staff_admin') DEFAULT 'staff_admin',
  `is_active` BOOLEAN DEFAULT TRUE,
  `permissions` JSON,
  `last_login_at` DATETIME(3),
  `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3)
);
```

### Customer Table (Separate):
```sql
CREATE TABLE `customers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `full_name` VARCHAR(191),
  `phone` VARCHAR(191) UNIQUE NOT NULL,
  `password_hash` VARCHAR(191),  -- Note: different field name!
  `role` ENUM('customer', 'admin', 'staff_admin') DEFAULT 'customer',
  ...
);
```

### User Sessions (Supports Both):
```sql
CREATE TABLE `user_sessions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `customer_id` INT,          -- For customer/barber logins
  `barber_id` INT,            -- For barber logins
  `admin_id` INT,             -- ✅ NEW: For admin logins
  `token` VARCHAR(191) UNIQUE,
  `refresh_token` VARCHAR(191) UNIQUE,
  ...
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`),
  FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`),
  FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`)  -- ✅ NEW
);
```

---

## 🔑 **ADMIN CREDENTIALS**

### Main Admin (Full Access):
```
Phone: 09999918441
Password: admin123456
Role: admin
Email: admin@hairdresser.com
```

### Staff Admin (Limited Access):
```
Phone: 09999918442
Password: staff123456
Role: staff_admin
Email: staff@hairdresser.com
```

---

## 🚀 **TESTING**

### 1. Test Admin Login:
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"09999918441","password":"admin123456"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "ورود به پنل مدیریت با موفقیت انجام شد",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "phone": "09999918441",
    "fullName": "مدیر سیستم",
    "email": "admin@hairdresser.com",
    "role": "admin",
    "isActive": true
  }
}
```

### 2. Test Customer Login (Should Still Work):
```bash
curl -X POST http://localhost:3000/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","password":"123456"}'
```

---

## 📁 **FILES CHANGED**

| File | Change |
|------|--------|
| `src-back/All_Utils/Admin/admin-login.service.ts` | ✅ **NEW** - Admin login logic |
| `src-back/All_Utils/Admin/admin-login.controller.ts` | ✅ **NEW** - Admin login controller |
| `src-back/All_Utils/routes/routes.ts` | ✅ Added `/admin/login` route |
| `src-front/admin/src/services/auth.service.ts` | ✅ Changed to use `/admin/login` |
| `prisma/seed.ts` | ✅ Fixed to create admins in Admin table |
| `prisma/schema.prisma` | ✅ Synced with database using `db pull` |

---

## ✅ **VERIFICATION CHECKLIST**

- [x] Admin table exists in database
- [x] Admin users seeded (2 admins)
- [x] Admin login endpoint created (`POST /api/admin/login`)
- [x] Admin login service searches Admin table only
- [x] Frontend uses correct admin endpoint
- [x] Customer login still works separately
- [x] Schema synced with database
- [x] Seed script creates admins correctly
- [x] Sessions track adminId separately

---

## 🎉 **RESULT**

**✅ Admin panel login now works correctly!**

- Admins authenticate through `/api/admin/login`
- Customers authenticate through `/api/auth/login/password`
- Separate tables, separate endpoints, separate tokens
- No more confusion between admin and customer accounts!

---

## 🔄 **TO RUN SEED AGAIN**

```bash
# Clear and reseed database
npm run prisma:seed

# Or manually
npx ts-node prisma/seed.ts
```

---

## 📝 **NOTES**

- Admin passwords are hashed with bcrypt (10 salt rounds)
- Admin tokens include `isAdmin: true` flag for easy identification
- Admin sessions are tracked separately in `user_sessions.admin_id`
- Inactive admins (`isActive = false`) cannot login
- Staff admins have limited permissions (can be expanded via `permissions` JSON field)

