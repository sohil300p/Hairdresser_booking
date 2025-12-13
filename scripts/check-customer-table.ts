import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCustomerColumns() {
  try {
    const columns = await prisma.$queryRaw`
      SHOW COLUMNS FROM customers
    `;
    
    console.log('\n📋 CUSTOMERS TABLE STRUCTURE:\n');
    console.log('='.repeat(70));
    if (Array.isArray(columns)) {
      columns.forEach((col: any) => {
        console.log(`  ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    console.log('='.repeat(70));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomerColumns();

