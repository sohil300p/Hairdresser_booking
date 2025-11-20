import prisma from '../../config/prisma';
import {
  GetBarbershopServicesRequest,
  GetBarbershopServicesResponse,
  ServiceItem,
} from './barbershop-services.type';

/**
 * Get barbershop services with action (increment view count)
 */
export async function getBarbershopServicesService(
  params: GetBarbershopServicesRequest
): Promise<GetBarbershopServicesResponse> {
  try {
    // Check if barbershop exists
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: params.barbershopId },
      select: {
        id: true,
        publicMeta: true,
      },
    });

    if (!barbershop) {
      return {
        success: false,
        message: 'آرایشگاه یافت نشد',
      };
    }

    // Increment services view count (action in database)
    const publicMeta = (barbershop.publicMeta || {}) as any;
    const currentViewCount = typeof publicMeta.servicesViewCount === 'number' ? publicMeta.servicesViewCount : 0;
    
    await prisma.barbershop.update({
      where: { id: params.barbershopId },
      data: {
        publicMeta: {
          ...publicMeta,
          servicesViewCount: currentViewCount + 1,
          lastServicesViewedAt: Date.now(),
        },
        updated: BigInt(Date.now()),
      },
    });

    // Get all services
    const services = await prisma.service.findMany({
      where: {
        barbershopId: params.barbershopId,
      },
      include: {
        addons: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        created: 'desc',
      },
    });

    const serviceItems: ServiceItem[] = services.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price ? Number(service.price) : null,
      estimatedTime: service.estimatedTime,
      description: service.description,
      readmore: service.readmore,
      avatar: service.avatar,
      isVip: service.isVip,
      isMedical: service.isMedical,
      gender: service.gender,
      parentServiceId: service.parentServiceId,
      addonsCount: service.addons.length,
    }));

    return {
      success: true,
      message: 'خدمات آرایشگاه با موفقیت دریافت شد',
      data: {
        services: serviceItems,
        total: serviceItems.length,
        viewCount: currentViewCount + 1,
      },
    };
  } catch (error) {
    console.error('Error getting barbershop services:', error);
    return {
      success: false,
      message: 'دریافت خدمات آرایشگاه با خطا مواجه شد',
    };
  }
}

