import prisma from '../../../All_Utils/config/prisma';

export const DEFAULT_IMAGE_KEYS = {
  barberProfile: 'defaultBarberProfileImageUrl',
  barberHeader: 'defaultBarberHeaderImageUrl',
} as const;

const FALLBACK_PROFILE = 'https://picsum.photos/id/1027/200/200';
const FALLBACK_HEADER = 'https://picsum.photos/seed/barbershop/600/400';

export interface DefaultImages {
  defaultBarberProfileImageUrl: string;
  defaultBarberHeaderImageUrl: string;
}

export async function getDefaultImagesService(): Promise<DefaultImages> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: { in: [DEFAULT_IMAGE_KEYS.barberProfile, DEFAULT_IMAGE_KEYS.barberHeader] },
    },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    defaultBarberProfileImageUrl: map.get(DEFAULT_IMAGE_KEYS.barberProfile)?.trim() || FALLBACK_PROFILE,
    defaultBarberHeaderImageUrl: map.get(DEFAULT_IMAGE_KEYS.barberHeader)?.trim() || FALLBACK_HEADER,
  };
}

export async function updateDefaultImagesService(data: Partial<DefaultImages>): Promise<DefaultImages> {
  if (data.defaultBarberProfileImageUrl !== undefined) {
    await prisma.appSetting.upsert({
      where: { key: DEFAULT_IMAGE_KEYS.barberProfile },
      create: { key: DEFAULT_IMAGE_KEYS.barberProfile, value: data.defaultBarberProfileImageUrl.trim() || null },
      update: { value: data.defaultBarberProfileImageUrl.trim() || null },
    });
  }
  if (data.defaultBarberHeaderImageUrl !== undefined) {
    await prisma.appSetting.upsert({
      where: { key: DEFAULT_IMAGE_KEYS.barberHeader },
      create: { key: DEFAULT_IMAGE_KEYS.barberHeader, value: data.defaultBarberHeaderImageUrl.trim() || null },
      update: { value: data.defaultBarberHeaderImageUrl.trim() || null },
    });
  }
  return getDefaultImagesService();
}
