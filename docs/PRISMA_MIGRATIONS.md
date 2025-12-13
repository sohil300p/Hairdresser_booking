# Prisma Migrations Guide

## 📋 Table of Contents
1. [Basic Commands](#basic-commands)
2. [Development Workflow](#development-workflow)
3. [Production Deployment](#production-deployment)
4. [Common Scenarios](#common-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Basic Commands

### Create and Apply Migration (Development)
```bash
# Make changes to schema.prisma first, then:
npx prisma migrate dev --name your_migration_name

# Example:
npx prisma migrate dev --name add_user_table
npx prisma migrate dev --name add_email_to_users
```

### Create Migration WITHOUT Applying
```bash
# Only create the SQL file, don't apply it yet
npx prisma migrate dev --create-only --name your_migration_name

# Review the generated SQL, then apply:
npx prisma migrate dev
```

### Apply Migrations (Production)
```bash
# Apply pending migrations without prompts
npx prisma migrate deploy
```

### Check Migration Status
```bash
# See which migrations are applied/pending
npx prisma migrate status
```

### Generate Prisma Client
```bash
# After any schema changes, regenerate the client
npx prisma generate
```

---

## 🔄 Development Workflow

### Step 1: Make Schema Changes
Edit `prisma/schema.prisma`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique    // ← Added this field
  name      String?
  createdAt DateTime @default(now())
}
```

### Step 2: Create Migration
```bash
npx prisma migrate dev --name add_email_to_users
```

**What happens:**
1. ✅ Prisma generates SQL in `prisma/migrations/TIMESTAMP_add_email_to_users/migration.sql`
2. ✅ Applies migration to your development database
3. ✅ Regenerates Prisma Client
4. ✅ Updates `_prisma_migrations` table

### Step 3: Review Generated SQL
```bash
# Open: prisma/migrations/20251213120000_add_email_to_users/migration.sql
```

Example content:
```sql
-- AlterTable
ALTER TABLE `user` ADD COLUMN `email` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_email_key` ON `user`(`email`);
```

### Step 4: Commit to Git
```bash
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "Add email field to User model"
```

---

## 🚀 Production Deployment

### Option A: Automated (CI/CD)
```yaml
# .github/workflows/deploy.yml
- name: Run Migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Option B: Manual
```bash
# SSH into production server
ssh user@production-server

# Navigate to project
cd /var/www/your-app

# Pull latest code (includes migrations)
git pull

# Run migrations
npx prisma migrate deploy

# Restart your app
pm2 restart app
```

---

## 📚 Common Scenarios

### Scenario 1: Adding a New Table
```prisma
// schema.prisma
model Admin {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}
```

```bash
npx prisma migrate dev --name add_admin_table
```

### Scenario 2: Adding a Field
```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  phone     String?  // ← Added this
}
```

```bash
npx prisma migrate dev --name add_phone_to_users
```

### Scenario 3: Adding a Relation
```prisma
model User {
  id        Int       @id @default(autoincrement())
  posts     Post[]    // ← Added relation
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  userId    Int      // ← Added foreign key
  user      User     @relation(fields: [userId], references: [id])
}
```

```bash
npx prisma migrate dev --name add_user_posts_relation
```

### Scenario 4: Database Already Has Schema (Baselining)
```bash
# 1. Mark existing state as migrated
npx prisma migrate resolve --applied MIGRATION_NAME

# 2. Create new migrations normally
npx prisma migrate dev --name your_changes
```

### Scenario 5: Reset Database (Development Only!)
```bash
# ⚠️ WARNING: This deletes all data!
npx prisma migrate reset

# What it does:
# 1. Drops database
# 2. Creates database
# 3. Applies all migrations
# 4. Runs seed script (if exists)
```

---

## 🔧 Troubleshooting

### Error: "P3005 - Database schema is not empty"
**Problem:** Trying to create migrations on existing database

**Solutions:**

**Option 1:** Mark current state as baseline
```bash
# Create a migration file
npx prisma migrate dev --create-only --name baseline

# Mark it as applied
npx prisma migrate resolve --applied baseline
```

**Option 2:** Use db push (development only)
```bash
# Push schema directly without migrations
npx prisma db push
```

**Option 3:** Reset database (⚠️ deletes data!)
```bash
npx prisma migrate reset
```

### Error: "Migration already applied"
```bash
# Mark migration as applied manually
npx prisma migrate resolve --applied MIGRATION_NAME
```

### Error: "Migration failed to apply"
```bash
# Mark as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Fix the migration SQL file, then retry
npx prisma migrate dev
```

### Error: File Lock (Windows)
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Then regenerate
npx prisma generate
```

---

## 📁 Migration File Structure

```
prisma/
├── migrations/
│   ├── 20251123120000_init/
│   │   └── migration.sql
│   ├── 20251213120000_add_admin_table/
│   │   └── migration.sql
│   ├── 20251213140000_add_email_field/
│   │   └── migration.sql
│   └── migration_lock.toml
└── schema.prisma
```

### Migration Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name/
  └── migration.sql

Example:
20251213120000_add_user_email/
  └── migration.sql
```

---

## ✅ Best Practices

### 1. Always Review Generated SQL
```bash
# Create without applying
npx prisma migrate dev --create-only --name add_field

# Review the SQL file
cat prisma/migrations/TIMESTAMP_add_field/migration.sql

# If good, apply it
npx prisma migrate dev
```

### 2. Use Descriptive Names
```bash
# ❌ Bad
npx prisma migrate dev --name update

# ✅ Good
npx prisma migrate dev --name add_email_verification_to_users
```

### 3. Small, Focused Migrations
```bash
# ❌ Bad: One huge migration
npx prisma migrate dev --name big_update

# ✅ Good: Multiple small migrations
npx prisma migrate dev --name add_admin_table
npx prisma migrate dev --name add_user_roles
npx prisma migrate dev --name create_indexes
```

### 4. Always Commit Migrations
```bash
# Never ignore migrations in .gitignore!
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "Add admin table migration"
```

### 5. Test Migrations Before Production
```bash
# On staging environment
npx prisma migrate deploy

# Verify everything works
# Then deploy to production
```

---

## 🔄 Team Workflow

### Developer A: Creates Migration
```bash
# 1. Edit schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_feature

# 3. Commit and push
git add .
git commit -m "Add feature"
git push
```

### Developer B: Applies Migration
```bash
# 1. Pull latest code
git pull

# 2. Apply migrations
npx prisma migrate dev

# ✅ Database is now in sync!
```

---

## 🎯 Quick Reference

| Command | Use Case | Environment |
|---------|----------|-------------|
| `prisma migrate dev` | Create & apply migration | Development |
| `prisma migrate dev --create-only` | Create migration only | Development |
| `prisma migrate deploy` | Apply migrations | Production |
| `prisma migrate status` | Check migration status | Any |
| `prisma migrate resolve --applied NAME` | Mark as applied | Any |
| `prisma migrate reset` | Reset database | Development |
| `prisma db push` | Push schema (no migration) | Development |
| `prisma generate` | Regenerate client | Any |

---

## 📞 Need Help?

**Prisma Docs:** https://www.prisma.io/docs/concepts/components/prisma-migrate

**Common Issues:**
- Schema not in sync: `npx prisma migrate dev`
- Client outdated: `npx prisma generate`
- Migration failed: `npx prisma migrate resolve --rolled-back NAME`

---

**Created:** 2025-12-13  
**Last Updated:** 2025-12-13

