import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;
    
    console.log('\n📊 DATABASE TABLES:\n');
    console.log('='.repeat(50));
    
    if (Array.isArray(tables)) {
      tables.forEach((table: any, index: number) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${table.TABLE_NAME}`);
      });
      console.log('='.repeat(50));
      console.log(`\n✅ Total tables: ${tables.length}\n`);
    }
  } catch (error) {
    console.error('❌ Error listing tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTables();

