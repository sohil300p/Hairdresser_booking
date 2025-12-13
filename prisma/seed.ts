import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user in Admin table (upsert - create if doesn't exist, update if exists)
  console.log('👤 Creating/updating admin user in Admin table...');
  const adminPassword = 'admin123456';
  const adminPhone = '09999918441';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { phone: adminPhone },
    update: {
      password: hashedAdminPassword,
      role: 'admin',
      fullName: 'مدیر سیستم',
      email: 'admin@hairdresser.com',
      isActive: true,
    },
    create: {
      phone: adminPhone,
      password: hashedAdminPassword,
      role: 'admin',
      fullName: 'مدیر سیستم',
      email: 'admin@hairdresser.com',
      isActive: true,
    }
  });

  console.log(`✅ Admin user created/updated in Admin table: ${adminPhone} (ID: ${admin.id})`);

  // Create a staff admin
  console.log('👤 Creating/updating staff admin user...');
  const staffPassword = 'staff123456';
  const staffPhone = '09999918442';
  const hashedStaffPassword = await bcrypt.hash(staffPassword, 10);

  const staffAdmin = await prisma.admin.upsert({
    where: { phone: staffPhone },
    update: {
      password: hashedStaffPassword,
      role: 'staff_admin',
      fullName: 'کارشناس پشتیبانی',
      email: 'staff@hairdresser.com',
      isActive: true,
    },
    create: {
      phone: staffPhone,
      password: hashedStaffPassword,
      role: 'staff_admin',
      fullName: 'کارشناس پشتیبانی',
      email: 'staff@hairdresser.com',
      isActive: true,
    }
  });

  console.log(`✅ Staff admin user created/updated: ${staffPhone} (ID: ${staffAdmin.id})`);

  // Clear existing test customers (but keep admins)
  console.log('🧹 Cleaning existing test customers...');
  await prisma.customer.deleteMany({});

  // Create test customers
  console.log('👥 Creating test customers...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        fullName: 'علی احمدی',
        phone: '09123456789',
        password_hash: hashedPassword, // Use password_hash
        role: 'customer',
        publicMeta: {
          preferences: {
            notifications: true,
            language: 'fa'
          }
        },
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      }
    }),
    prisma.customer.create({
      data: {
        fullName: 'سارا محمدی',
        phone: '09123456790',
        password_hash: hashedPassword, // Use password_hash
        role: 'customer',
        publicMeta: {
          preferences: {
            notifications: true,
            language: 'fa'
          }
        },
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      }
    }),
    prisma.customer.create({
      data: {
        fullName: 'محمد رضایی',
        phone: '09123456791',
        password_hash: hashedPassword, // Use password_hash
        role: 'customer',
        publicMeta: {},
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      }
    })
  ]);

  console.log(`✅ Created ${customers.length} test customers`);

  // Create wallets for all customers
  console.log('💰 Creating wallets for customers...');
  try {
    const { ensureCustomerWallet } = await import('../src-back/All_Utils/Wallet/wallet.utils');
    await Promise.all(
      customers.map(customer => ensureCustomerWallet(customer.id))
    );
    console.log(`✅ Wallets created for ${customers.length} customers`);
  } catch (error) {
    console.error('⚠️ Failed to create wallets for some customers:', error);
  }

  console.log('🎉 Database seeding completed successfully!');
  
  // Print summary
  console.log('\n📊 Seeding Summary:');
  console.log(`👤 Admins: 2 (1 admin + 1 staff_admin)`);
  console.log(`👥 Customers: ${customers.length}`);

  console.log('\n🔑 Admin Accounts:');
  console.log(`\n1. Main Admin:`);
  console.log(`   Phone: ${adminPhone}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: admin (Full Access)`);
  
  console.log(`\n2. Staff Admin:`);
  console.log(`   Phone: ${staffPhone}`);
  console.log(`   Password: ${staffPassword}`);
  console.log(`   Role: staff_admin (Limited Access)`);

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