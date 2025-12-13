import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Ensure wallet exists for a user/barber/barbershop
 * Creates wallet if it doesn't exist
 */
export async function ensureWallet(
  ownerType: 'customer' | 'barber' | 'barbershop' | 'system',
  ownerId: number,
  currency: string = 'IRR'
): Promise<{ id: number; balance: Decimal }> {
  let wallet = await prisma.wallet.findFirst({
    where: {
      ownerType,
      ownerId,
      currency,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        ownerType,
        ownerId,
        currency,
        balance: new Decimal(0),
        created: BigInt(Date.now()),
        updated: BigInt(Date.now()),
      },
    });
    console.log(`✅ Wallet created for ${ownerType} ID ${ownerId}`);
  }

  return wallet;
}

/**
 * Ensure wallet exists for a customer
 */
export async function ensureCustomerWallet(customerId: number): Promise<void> {
  await ensureWallet('customer', customerId);
}

/**
 * Ensure wallet exists for a barber
 */
export async function ensureBarberWallet(barberId: number): Promise<void> {
  await ensureWallet('barber', barberId);
}

/**
 * Ensure wallet exists for a barbershop
 */
export async function ensureBarbershopWallet(barbershopId: number): Promise<void> {
  await ensureWallet('barbershop', barbershopId);
}

