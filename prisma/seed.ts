import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user (upsert - create if doesn't exist, update if exists)
  console.log('👤 Creating/updating admin user...');
  const adminPassword = 'password';
  const adminPhone = '09999918441';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.customer.upsert({
    where: { phone: adminPhone },
    update: {
      password: hashedAdminPassword,
      role: 'admin',
      fullName: 'مدیر سیستم',
      publicMeta: {
        isSystemAdmin: true
      }
    },
    create: {
      phone: adminPhone,
      password: hashedAdminPassword,
      role: 'admin',
      fullName: 'مدیر سیستم',
      publicMeta: {
        isSystemAdmin: true
      }
    }
  });

  console.log(`✅ Admin user created/updated: ${adminPhone} (ID: ${admin.id})`);

  // Clear existing test data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing test data...');
  await prisma.customer.deleteMany({
    where: {
      phone: {
        not: adminPhone
      }
    }
  });

  // Create test customers
  console.log('👥 Creating test customers...');
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
    })
  ]);

  console.log(`✅ Created ${customers.length} test customers`);

  console.log('🎉 Database seeding completed successfully!');
  
  // Print summary
  console.log('\n📊 Seeding Summary:');
  console.log(`👤 Admin: 1`);
  console.log(`👥 Customers: ${customers.length}`);

  console.log('\n🔑 Admin Account:');
  console.log(`Phone: ${adminPhone}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`Role: admin`);

  console.log('\n🔑 Test Customer Accounts:');
  console.log('Customer: 09123456789 (علی احمدی)');
  console.log('Customer: 09123456790 (سارا محمدی)');
  console.log('Customer: 09123456791 (محمد رضایی)');
  console.log('Password for test customers: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });