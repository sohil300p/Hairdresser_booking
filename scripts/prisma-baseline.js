/**
 * Baseline existing database: mark all current migrations as already applied.
 * Run this ONCE when you have an existing DB with tables but no migration history (P3005).
 * 1. Creates _prisma_migrations table if missing (required for resolve --applied).
 * 2. Marks all existing migrations as applied.
 * After that, use: npm run prisma:migrate:deploy (to apply migrations) or npm run prisma:migrate (to create new ones).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const sqlPath = path.join(root, 'prisma', 'create-migrations-table.sql');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

// 1. Ensure _prisma_migrations table exists (P3005 fix when table was never created)
if (fs.existsSync(sqlPath)) {
  try {
    run(`npx prisma db execute --file prisma/create-migrations-table.sql --schema prisma/schema.prisma`);
    console.log('  ✓ _prisma_migrations table ready\n');
  } catch (e) {
    if (!e.message || !e.message.includes('already exists')) {
      console.warn('  ⚠ Could not create _prisma_migrations table (may already exist):', e.message || e);
    }
  }
}

const migrations = [
  '20251123222102_init',
  '20251213_add_admin_table',
  '20251214000000_add_reservation_rules_to_barbershop',
];

for (const name of migrations) {
  try {
    run(`npx prisma migrate resolve --applied "${name}"`);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    if (e.status === 0) {
      console.log(`  ✓ ${name}`);
    } else {
      console.error(`  ✗ ${name}:`, e.message || e);
      process.exit(1);
    }
  }
}

console.log('\nBaseline done. Run: npm run prisma:migrate:deploy  (or npm run prisma:migrate for new migrations)');
