import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { phone: '09999918441' },
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.fullName);
      return;
    }

    // Hash password
    const password = 'admin123456'; // Change this!
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        fullName: 'مدیر سیستم',
        phone: '09999918441',
        email: 'admin@hairdresser.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    console.log('✅ Admin created successfully:');
    console.log('📞 Phone:', admin.phone);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', admin.fullName);
    console.log('⚠️  IMPORTANT: Change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

