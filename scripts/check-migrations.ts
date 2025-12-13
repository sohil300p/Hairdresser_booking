import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrations() {
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC
    `;
    
    console.log('\n📋 APPLIED MIGRATIONS:\n');
    console.log('='.repeat(70));
    
    if (Array.isArray(migrations)) {
      migrations.forEach((migration: any, index: number) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${migration.migration_name}`);
        console.log(`    Finished: ${migration.finished_at || 'Marked as applied'}`);
        console.log(`    Steps: ${migration.applied_steps_count}`);
        console.log('');
      });
      console.log('='.repeat(70));
      console.log(`\n✅ Total migrations: ${migrations.length}\n`);
    }
  } catch (error) {
    console.error('❌ Error checking migrations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();

