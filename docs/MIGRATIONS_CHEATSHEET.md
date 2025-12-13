# Prisma Migrations - Quick Cheat Sheet 🚀

## 📝 Most Common Commands

```bash
# 1. Create & Apply Migration (Development)
npx prisma migrate dev --name your_change_name

# 2. Apply Migrations (Production)
npx prisma migrate deploy

# 3. Check Status
npx prisma migrate status

# 4. Regenerate Client
npx prisma generate
```

---

## 🔄 Typical Workflow

```mermaid
1. Edit schema.prisma
   ↓
2. npx prisma migrate dev --name change_name
   ↓
3. Review generated SQL
   ↓
4. Test locally
   ↓
5. Commit to Git
   ↓
6. Deploy: npx prisma migrate deploy
```

---

## ⚡ Quick Examples

### Add a Field
```prisma
model User {
  email String @unique  // ← Add this
}
```
```bash
npx prisma migrate dev --name add_email_to_user
```

### Add a Table
```prisma
model Admin {
  id    Int    @id @default(autoincrement())
  name  String
}
```
```bash
npx prisma migrate dev --name add_admin_table
```

### Add a Relation
```prisma
model Post {
  userId Int
  user   User @relation(fields: [userId], references: [id])
}
```
```bash
npx prisma migrate dev --name add_user_post_relation
```

---

## 🚨 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| "Database not empty" | `npx prisma migrate resolve --applied MIGRATION_NAME` |
| "Migration failed" | `npx prisma migrate resolve --rolled-back NAME` |
| File lock error | Kill node processes, then `npx prisma generate` |
| Out of sync | `npx prisma migrate dev` |

---

## ✅ Do's and ❌ Don'ts

### ✅ DO:
- Review generated SQL before applying
- Use descriptive migration names
- Commit migrations to Git
- Test on staging first
- Keep migrations small

### ❌ DON'T:
- Edit old migration files
- Delete migration files
- Use `migrate reset` in production
- Skip testing migrations
- Ignore migration errors

---

## 🎯 Environment-Specific

### Development
```bash
npx prisma migrate dev --name change_name
```

### Production
```bash
npx prisma migrate deploy
```

### Reset (Dev Only - Deletes Data!)
```bash
npx prisma migrate reset
```

---

**💡 Pro Tip:** Always run `npx prisma generate` after schema changes!

---

For detailed guide, see: [docs/PRISMA_MIGRATIONS.md](./PRISMA_MIGRATIONS.md)

