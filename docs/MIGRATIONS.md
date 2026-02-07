# Prisma migrations

## Error: "The database schema is not empty" (P3005)

Your database already has tables but Prisma has no migration history (and often no `_prisma_migrations` table). **Baseline once**, then use deploy.

### 1. Baseline (run once)

```bash
npm run prisma:baseline
```

This creates the `_prisma_migrations` table if missing, then marks all current migrations as applied. No data is changed; only migration history is set.

### 2. Apply pending migrations (no shadow DB)

After baselining, use **deploy** to apply any pending migrations (e.g. on CI or when you pull new migrations):

```bash
npm run prisma:migrate:deploy
```

### 3. Creating new migrations (dev only)

Use **migrate dev** only when you change `schema.prisma` and want to generate a new migration file. It requires a working shadow DB (see below). To only apply existing migrations, use `prisma:migrate:deploy` instead.

```bash
npm run prisma:migrate
```

## Shadow database (P3006)

If you see errors about the **shadow database**, set in `.env`:

- `DATABASE_URL` – your main MySQL URL (e.g. `mysql://user:pass@localhost:3306/barber_booking`)
- `SHADOW_DATABASE_URL` – a second database on the same server (e.g. `mysql://user:pass@localhost:3306/barber_booking_shadow`)

Create the shadow DB once (e.g. in MySQL: `CREATE DATABASE barber_booking_shadow;`), then run `npm run prisma:migrate`.
