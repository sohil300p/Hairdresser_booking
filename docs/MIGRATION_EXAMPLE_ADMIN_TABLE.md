# Real Example: Adding Admin Table Migration

This is the actual migration we created for the Hairdresser Booking system.

## 📋 What We Did

### Step 1: Updated Schema
**File:** `prisma/schema.prisma`

Added new `Admin` model:
```prisma
model Admin {
  id          Int       @id @default(autoincrement())
  fullName    String    @map("full_name")
  phone       String    @unique
  email       String?   @unique
  password    String
  avatar      String?
  role        Role      @default(staff_admin)
  isActive    Boolean   @default(true) @map("is_active")
  permissions Json?
  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  sessions UserSession[] @relation("AdminSessions")

  @@index([phone])
  @@index([email])
  @@map("admin")
}
```

Updated `UserSession` model:
```prisma
model UserSession {
  id           Int     @id @default(autoincrement())
  customerId   Int?    @map("customer_id")
  barberId     Int?    @map("barber_id")
  adminId      Int?    @map("admin_id")  // ← Added this
  // ... other fields

  customer Customer? @relation("CustomerSessions", fields: [customerId], references: [id])
  barber   Barber?   @relation("BarberSessions", fields: [barberId], references: [id])
  admin    Admin?    @relation("AdminSessions", fields: [adminId], references: [id])  // ← Added this

  @@index([adminId])  // ← Added this
}
```

### Step 2: Created Migration
```bash
# Since database already existed, we used manual migration
mkdir -p prisma/migrations/20251213_add_admin_table
```

Created `prisma/migrations/20251213_add_admin_table/migration.sql`:
```sql
-- CreateTable: Add Admin table
CREATE TABLE `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('customer', 'admin', 'staff_admin') NOT NULL DEFAULT 'staff_admin',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `permissions` JSON NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_phone_key`(`phone`),
    UNIQUE INDEX `admin_email_key`(`email`),
    INDEX `admin_phone_idx`(`phone`),
    INDEX `admin_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Add admin_id to user_sessions
ALTER TABLE `user_sessions` ADD COLUMN `admin_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `user_sessions_admin_id_idx` ON `user_sessions`(`admin_id`);

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_admin_id_fkey` 
    FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE;
```

### Step 3: Applied Migration
```bash
# Push schema to database
npx prisma db push

# Mark migration as applied
npx prisma migrate resolve --applied 20251213_add_admin_table

# Regenerate Prisma client
npx prisma generate
```

### Step 4: Created Admin User
Created `scripts/create-admin.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123456', 10);
  
  const admin = await prisma.admin.create({
    data: {
      fullName: 'مدیر سیستم',
      phone: '09999918441',
      email: 'admin@hairdresser.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  });
  
  console.log('✅ Admin created:', admin.fullName);
}

createAdmin();
```

Run it:
```bash
npx tsx scripts/create-admin.ts
```

### Step 5: Verified
```bash
# Check migration status
npx prisma migrate status
# Output: Database schema is up to date!

# Check if admin exists
npx prisma studio
# Navigate to Admin table and verify the record
```

---

## 📂 Final File Structure

```
prisma/
├── migrations/
│   ├── 20251123222102_init/
│   │   └── migration.sql
│   ├── 20251213_add_admin_table/    ← New migration
│   │   └── migration.sql
│   └── migration_lock.toml
├── schema.prisma                     ← Updated
└── seed.ts

scripts/
├── create-admin.ts                   ← New script
└── insert-admin.sql                  ← New SQL
```

---

## ✅ Result

**Before:**
- ❌ No Admin table
- ❌ Admins mixed with customers
- ❌ No staff management

**After:**
- ✅ Separate `admin` table
- ✅ Admin/Staff roles
- ✅ Permissions system
- ✅ Active/inactive status
- ✅ API endpoint: `/api/admin/staff`
- ✅ Frontend page: Staff Management

---

## 🔄 For Team Members

When your team pulls this code:

```bash
# 1. Pull latest code
git pull

# 2. Apply migrations
npx prisma migrate dev
# OR for production:
npx prisma migrate deploy

# 3. Generate client
npx prisma generate

# 4. Restart server
npm run dev
```

---

## 💡 Lessons Learned

### ✅ What Worked Well:
1. Creating manual migration file for existing database
2. Using `migrate resolve --applied` to mark as done
3. Separate admin table (not mixed with customers)
4. Creating seed script for initial admin

### 🔧 What We Fixed:
1. File lock issues (killed node processes)
2. Database already exists (used baseline approach)
3. Schema drift (resolved with manual migration)

### 📚 Best Practices Applied:
1. Descriptive migration name
2. Proper SQL with indexes
3. Foreign key constraints
4. Seed data for testing
5. Documentation

---

**Date:** 2025-12-13  
**Migration:** `20251213_add_admin_table`  
**Status:** ✅ Successfully Applied

