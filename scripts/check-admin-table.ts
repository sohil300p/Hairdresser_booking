import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminTable() {
  try {
    // Check table structure
    const columns = await prisma.$queryRaw`
      SHOW COLUMNS FROM admin
    `;
    
    console.log('\n📋 ADMIN TABLE STRUCTURE:\n');
    console.log('='.repeat(70));
    if (Array.isArray(columns)) {
      columns.forEach((col: any) => {
        console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    console.log('='.repeat(70));
    
    // Check admin records
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
    
    console.log('\n👥 ADMIN USERS:\n');
    console.log('='.repeat(70));
    if (admins.length === 0) {
      console.log('  ⚠️  No admin users found in database!');
    } else {
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.fullName} (${admin.role})`);
        console.log(`     Phone: ${admin.phone}`);
        console.log(`     Email: ${admin.email || 'N/A'}`);
        console.log(`     Active: ${admin.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`     Created: ${admin.createdAt}`);
        console.log('');
      });
    }
    console.log('='.repeat(70));
    console.log(`\n✅ Total admins: ${admins.length}\n`);
    
  } catch (error) {
    console.error('❌ Error checking admin table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminTable();

