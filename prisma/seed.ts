import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.customer.deleteMany();

  // Create customers
  console.log('👥 Creating customers...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        fullName: 'علی احمدی',
        phone: '09123456789',
        password: hashedPassword,
        role: 'customer',
        publicMeta: {
          preferences: {
            notifications: true,
            language: 'fa'
          }
        }
      }
    }),
    prisma.customer.create({
      data: {
        fullName: 'سارا محمدی',
        phone: '09123456790',
        password: hashedPassword,
        role: 'customer',
        publicMeta: {
          preferences: {
            notifications: true,
            language: 'fa'
          }
        }
      }
    }),
    prisma.customer.create({
      data: {
        fullName: 'محمد رضایی',
        phone: '09123456791',
        password: hashedPassword,
        role: 'customer',
        publicMeta: {}
      }
    }),
    // Admin customer
    prisma.customer.create({
      data: {
        fullName: 'مدیر سیستم',
        phone: '09100000000',
        password: hashedPassword,
        role: 'admin',
        publicMeta: {
          isSystemAdmin: true
        }
      }
    })
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  console.log('🎉 Database seeding completed successfully!');
  
  // Print summary
  console.log('\n📊 Seeding Summary:');
  console.log(`👥 Customers: ${customers.length}`);

  console.log('\n🔑 Test Accounts:');
  console.log('Customer: 09123456789 (علی احمدی)');
  console.log('Customer: 09123456790 (سارا محمدی)');
  console.log('Customer: 09123456791 (محمد رضایی)');
  console.log('Admin: 09100000000 (مدیر سیستم)');
  console.log('Password for all: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });