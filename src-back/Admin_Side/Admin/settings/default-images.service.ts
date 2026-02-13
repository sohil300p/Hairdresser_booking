import prisma from '../../../All_Utils/config/prisma';
import { minioClient, DEFAULT_BUCKET, minioConfig } from '../../../All_Utils/config/minio';
import { v4 as uuidv4 } from 'uuid';

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

export interface UpdateDefaultImagesInput {
  defaultBarberProfileImageUrl?: string;
  defaultBarberHeaderImageUrl?: string;
  profileImageFile?: Express.Multer.File;
  headerImageFile?: Express.Multer.File;
}

async function uploadToMinIO(file: Express.Multer.File, prefix: string): Promise<string> {
  const ext = file.originalname.split('.').pop() || 'jpg';
  const fileName = `default-images/${prefix}-${uuidv4()}.${ext}`;
  await minioClient.putObject(DEFAULT_BUCKET, fileName, file.buffer, file.size, {
    'Content-Type': file.mimetype,
  });
  return `${minioConfig.publicUrl}/${DEFAULT_BUCKET}/${fileName}`;
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

export async function updateDefaultImagesService(input: UpdateDefaultImagesInput): Promise<DefaultImages> {
  const data: Partial<DefaultImages> = {};

  if (input.profileImageFile) {
    data.defaultBarberProfileImageUrl = await uploadToMinIO(input.profileImageFile, 'profile');
  } else if (input.defaultBarberProfileImageUrl !== undefined) {
    data.defaultBarberProfileImageUrl = input.defaultBarberProfileImageUrl.trim() || undefined;
  }

  if (input.headerImageFile) {
    data.defaultBarberHeaderImageUrl = await uploadToMinIO(input.headerImageFile, 'header');
  } else if (input.defaultBarberHeaderImageUrl !== undefined) {
    data.defaultBarberHeaderImageUrl = input.defaultBarberHeaderImageUrl.trim() || undefined;
  }

  if (data.defaultBarberProfileImageUrl !== undefined) {
    await prisma.appSetting.upsert({
      where: { key: DEFAULT_IMAGE_KEYS.barberProfile },
      create: { key: DEFAULT_IMAGE_KEYS.barberProfile, value: data.defaultBarberProfileImageUrl || null },
      update: { value: data.defaultBarberProfileImageUrl || null },
    });
  }
  if (data.defaultBarberHeaderImageUrl !== undefined) {
    await prisma.appSetting.upsert({
      where: { key: DEFAULT_IMAGE_KEYS.barberHeader },
      create: { key: DEFAULT_IMAGE_KEYS.barberHeader, value: data.defaultBarberHeaderImageUrl || null },
      update: { value: data.defaultBarberHeaderImageUrl || null },
    });
  }
  return getDefaultImagesService();
}
