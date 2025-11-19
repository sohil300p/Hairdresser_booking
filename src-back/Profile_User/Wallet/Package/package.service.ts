import prisma from '../../../config/prisma';
import {
  GetAvailablePackagesResponse,
  PurchasePackageRequest,
  PurchasePackageResponse,
  GetUserPackagesResponse,
} from './package.type';
import { Decimal } from '@prisma/client/runtime/library';
import { depositService } from '../Transaction/transaction.service';

/**
 * Get available packages service
 */
export async function getAvailablePackagesService(): Promise<GetAvailablePackagesResponse> {
  try {
    const now = BigInt(Date.now());
    
    const packages = await prisma.package.findMany({
      where: {
        active: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } },
            ],
          },
        ],
      },
      orderBy: {
        created: 'desc',
      },
    });

    const formattedPackages = packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      type: pkg.type,
      price: Number(pkg.price),
      depositAmount: pkg.depositAmount ? Number(pkg.depositAmount) : null,
      serviceIds: pkg.serviceIds ? (pkg.serviceIds as number[]) : null,
      active: pkg.active,
      validFrom: pkg.validFrom ? Number(pkg.validFrom) : null,
      validUntil: pkg.validUntil ? Number(pkg.validUntil) : null,
    }));

    return {
      success: true,
      message: 'پکیج‌های موجود با موفقیت دریافت شد',
      packages: formattedPackages,
    };
  } catch (error) {
    console.error('Error getting available packages:', error);
    return {
      success: false,
      message: 'دریافت پکیج‌ها با خطا مواجه شد',
    };
  }
}

/**
 * Purchase package service
 */
export async function purchasePackageService(
  data: PurchasePackageRequest,
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<PurchasePackageResponse> {
  try {
    const { packageId, paymentMethod } = data;

    // Get package
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return {
        success: false,
        message: 'پکیج یافت نشد',
      };
    }

    if (!pkg.active) {
      return {
        success: false,
        message: 'این پکیج فعال نیست',
      };
    }

    // Check validity
    const now = BigInt(Date.now());
    if (pkg.validFrom && pkg.validFrom > now) {
      return {
        success: false,
        message: 'این پکیج هنوز فعال نشده است',
      };
    }

    if (pkg.validUntil && pkg.validUntil < now) {
      return {
        success: false,
        message: 'این پکیج منقضی شده است',
      };
    }

    // Process payment
    let externalTransactionId: number | undefined;

    if (paymentMethod === 'wallet') {
      // Use wallet balance
      const depositResult = await depositService(
        {
          amount: Number(pkg.price),
          method: 'wallet',
          metadata: { packageId, packageName: pkg.name },
        },
        authenticatedUserId,
        authenticatedUserType
      );

      if (!depositResult.success || !depositResult.externalTransactionId) {
        return {
          success: false,
          message: depositResult.message || 'پرداخت با خطا مواجه شد',
        };
      }

      externalTransactionId = depositResult.externalTransactionId;
    } else {
      // Create external transaction for online/card payment
      const externalTx = await prisma.externalTransaction.create({
        data: {
          initiatorType: authenticatedUserType === 'barber' ? 'barber' : 'customer',
          initiatorId: authenticatedUserId,
          kind: 'deposit',
          amount: new Decimal(pkg.price),
          method: paymentMethod as any,
          status: 'pending',
          metadata: { packageId, packageName: pkg.name },
          created: BigInt(Date.now()),
          updated: BigInt(Date.now()),
        },
      });

      externalTransactionId = externalTx.id;
    }

    // Create package purchase
    const purchase = await prisma.packagePurchase.create({
      data: {
        packageId: pkg.id,
        customerId: authenticatedUserType === 'customer' ? authenticatedUserId : null,
        barberId: authenticatedUserType === 'barber' ? authenticatedUserId : null,
        amount: new Decimal(pkg.price),
        externalTransactionId,
        used: false,
        expiresAt: pkg.validUntil,
        created: BigInt(Date.now()),
      },
    });

    return {
      success: true,
      message: 'پکیج با موفقیت خریداری شد',
      purchaseId: purchase.id,
      transactionId: externalTransactionId,
    };
  } catch (error) {
    console.error('Error purchasing package:', error);
    return {
      success: false,
      message: 'خرید پکیج با خطا مواجه شد',
    };
  }
}

/**
 * Get user packages service
 */
export async function getUserPackagesService(
  authenticatedUserId: number,
  authenticatedUserType: 'customer' | 'barber'
): Promise<GetUserPackagesResponse> {
  try {
    const where: any = {};
    
    if (authenticatedUserType === 'customer') {
      where.customerId = authenticatedUserId;
    } else {
      where.barberId = authenticatedUserId;
    }

    const purchases = await prisma.packagePurchase.findMany({
      where,
      include: {
        package: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created: 'desc',
      },
    });

    const formattedPackages = purchases.map((purchase) => ({
      id: purchase.id,
      packageId: purchase.packageId,
      packageName: purchase.package.name,
      amount: Number(purchase.amount),
      used: purchase.used,
      expiresAt: purchase.expiresAt ? Number(purchase.expiresAt) : null,
      createdAt: Number(purchase.created),
    }));

    return {
      success: true,
      message: 'پکیج‌های کاربر با موفقیت دریافت شد',
      packages: formattedPackages,
    };
  } catch (error) {
    console.error('Error getting user packages:', error);
    return {
      success: false,
      message: 'دریافت پکیج‌های کاربر با خطا مواجه شد',
    };
  }
}

