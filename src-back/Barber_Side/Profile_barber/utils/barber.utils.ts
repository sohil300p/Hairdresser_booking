import prisma from '../../../All_Utils/config/prisma';

/**
 * Ensures a barber record exists for the given customer ID.
 * If it doesn't exist, creates one. Returns the barber ID.
 * 
 * @param customerId - The customer/user ID
 * @returns The barber ID (existing or newly created)
 */
export async function ensureBarberRecord(customerId: number): Promise<number> {
  // First, check if barber record already exists
  const existingBarber = await prisma.barber.findFirst({
    where: { userRefId: customerId },
    select: { id: true },
  });

  if (existingBarber) {
    return existingBarber.id;
  }

  // Get customer phone for the barber record
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { phone: true },
  });

  if (!customer) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }

  // Create new barber record
  const newBarber = await prisma.barber.create({
    data: {
      userRefId: customerId,
      phone: customer.phone,
      created: BigInt(Date.now()),
      updated: BigInt(Date.now()),
    },
    select: { id: true },
  });

  console.log(`✅ Barber record auto-created for customer ID ${customerId} (Barber ID: ${newBarber.id})`);
  return newBarber.id;
}

