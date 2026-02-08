import prisma from '../../All_Utils/config/prisma';
import { randomBytes } from 'crypto';
import type { CreateInvitationRequest, InvitationItem, MemberItem, PendingInviteForBarber } from './seats.type';

const INVITATION_EXPIRY_DAYS = 7;

/** Normalize phone for storage and comparison (trim, no spaces, canonical 09xxxxxxxxx). */
function normalizePhone(phone: string): string {
  const s = (phone || '').trim().replace(/\s/g, '');
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (digits.startsWith('98') && digits.length >= 10) return '0' + digits.slice(2);
  if (digits.startsWith('9') && digits.length === 10) return '0' + digits;
  return s;
}

export async function getBarbershopIdForBarber(barberId: number): Promise<number | null> {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: {
      ownedBarbershops: { select: { id: true }, take: 1 },
      barbershopMembers: { select: { barbershopId: true }, take: 1 },
    },
  });
  if (!barber) return null;
  if (barber.ownedBarbershops.length > 0) return barber.ownedBarbershops[0].id;
  if (barber.barbershopMembers.length > 0) return barber.barbershopMembers[0].barbershopId;
  return null;
}

export async function createInvitationService(
  barberId: number,
  body: CreateInvitationRequest
): Promise<{ success: boolean; message: string; token?: string; invitationId?: number }> {
  const barbershop = await prisma.barbershop.findFirst({
    where: { ownerId: barberId },
    select: { id: true, name: true },
  });
  if (!barbershop) {
    return { success: false, message: 'فقط مالک سالن می‌تواند دعوتنامه ایجاد کند' };
  }

  const rawPhone = (body.inviteePhone || '').trim().replace(/\s/g, '');
  if (!rawPhone) {
    return { success: false, message: 'شماره تلفن دعوت‌شونده را وارد کنید' };
  }
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { success: false, message: 'شماره تلفن معتبر نیست' };
  }

  const owner = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { phone: true },
  });
  if (owner?.phone && normalizePhone(owner.phone) === phone) {
    return { success: false, message: 'نمی‌توانید برای خودتان دعوتنامه ایجاد کنید' };
  }

  const existingBarberByPhone = await prisma.barber.findFirst({
    where: { phone: { in: [phone, rawPhone] } },
    select: { id: true },
  });
  if (existingBarberByPhone) {
    const alreadyMember = await prisma.barbershopMember.findUnique({
      where: {
        barbershopId_barberId: { barbershopId: barbershop.id, barberId: existingBarberByPhone.id },
      },
    });
    if (alreadyMember) {
      return { success: false, message: 'این شماره قبلاً به سالن پیوسته است' };
    }
    if (existingBarberByPhone.id === barberId) {
      return { success: false, message: 'نمی‌توانید برای خودتان دعوتنامه ایجاد کنید' };
    }
  }

  const existing = await prisma.barbershopInvitation.findFirst({
    where: {
      barbershopId: barbershop.id,
      inviteePhone: phone,
      status: 'pending',
    },
  });
  if (existing && Number(existing.expiresAt) > Date.now()) {
    return {
      success: true,
      message: 'دعوتنامه قبلاً برای این شماره ارسال شده است',
      token: existing.token,
      invitationId: existing.id,
    };
  }

  const now = BigInt(Date.now());
  const expiresAt = BigInt(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const token = randomBytes(24).toString('hex');

  const inv = await prisma.barbershopInvitation.create({
    data: {
      barbershopId: barbershop.id,
      inviteePhone: phone,
      token,
      status: 'pending',
      invitedByBarberId: barberId,
      createdAt: now,
      expiresAt,
    },
  });

  return {
    success: true,
    message: `دعوتنامه برای ${phone} ایجاد شد. لینک دعوت را با وی به اشتراک بگذارید.`,
    token: inv.token,
    invitationId: inv.id,
  };
}

export async function listInvitationsService(barberId: number): Promise<{ success: boolean; message: string; invitations?: InvitationItem[] }> {
  const barbershop = await prisma.barbershop.findFirst({
    where: { ownerId: barberId },
    select: { id: true, name: true },
  });
  if (!barbershop) {
    return { success: false, message: 'فقط مالک سالن می‌تواند لیست دعوتنامه‌ها را ببیند' };
  }

  const list = await prisma.barbershopInvitation.findMany({
    where: { barbershopId: barbershop.id },
    orderBy: { createdAt: 'desc' },
  });

  const invitations: InvitationItem[] = list.map((i) => ({
    id: i.id,
    inviteePhone: i.inviteePhone,
    token: i.token,
    status: i.status,
    createdAt: Number(i.createdAt),
    expiresAt: Number(i.expiresAt),
    barbershopName: barbershop.name,
  }));

  return { success: true, message: 'لیست دعوتنامه‌ها', invitations };
}

export async function listMembersService(barberId: number): Promise<{ success: boolean; message: string; members?: MemberItem[] }> {
  const barbershop = await prisma.barbershop.findFirst({
    where: { ownerId: barberId },
    select: { id: true, ownerId: true },
  });
  if (!barbershop) {
    return { success: false, message: 'فقط مالک سالن می‌تواند لیست اعضا را ببیند' };
  }

  const owner = await prisma.barber.findUnique({
    where: { id: barbershop.ownerId },
    select: { id: true, fullName: true, phone: true },
  });

  const memberRows = await prisma.barbershopMember.findMany({
    where: { barbershopId: barbershop.id },
    include: { barber: { select: { id: true, fullName: true, phone: true } } },
  });

  const members: MemberItem[] = [];
  if (owner) {
    members.push({
      barberId: owner.id,
      fullName: owner.fullName,
      phone: owner.phone,
      role: 'owner',
      isOwner: true,
    });
  }
  memberRows.forEach((m) => {
    members.push({
      barberId: m.barber.id,
      fullName: m.barber.fullName,
      phone: m.barber.phone,
      role: m.role,
      isOwner: false,
      joinedAt: Number(m.joinedAt),
    });
  });

  return { success: true, message: 'لیست اعضا', members };
}

export async function getMyPendingInvitationsService(
  barberId: number
): Promise<{ success: boolean; message: string; invitations?: PendingInviteForBarber[] }> {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { phone: true },
  });
  if (!barber?.phone) {
    return { success: true, message: 'دعوتنامه‌ای وجود ندارد', invitations: [] };
  }

  const canonicalPhone = normalizePhone(barber.phone);
  const now = BigInt(Date.now());
  const list = await prisma.barbershopInvitation.findMany({
    where: {
      OR: [
        { inviteePhone: barber.phone },
        ...(canonicalPhone && canonicalPhone !== barber.phone ? [{ inviteePhone: canonicalPhone }] : []),
      ],
      status: 'pending',
      expiresAt: { gt: now },
    },
    include: { barbershop: { select: { id: true, name: true } } },
  });

  const invitations: PendingInviteForBarber[] = list.map((i) => ({
    token: i.token,
    barbershopName: i.barbershop.name,
    barbershopId: i.barbershop.id,
    expiresAt: Number(i.expiresAt),
  }));

  return { success: true, message: 'دعوتنامه‌های در انتظار', invitations };
}

export async function acceptInvitationService(
  barberId: number,
  token: string
): Promise<{ success: boolean; message: string; barbershopId?: number }> {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { phone: true },
  });
  if (!barber?.phone) {
    return { success: false, message: 'آرایشگر یافت نشد' };
  }

  const inv = await prisma.barbershopInvitation.findUnique({
    where: { token },
    include: { barbershop: { select: { id: true, ownerId: true } } },
  });

  if (!inv) {
    return { success: false, message: 'دعوتنامه یافت نشد' };
  }
  if (inv.status !== 'pending') {
    return { success: false, message: 'این دعوتنامه قبلاً استفاده یا منقضی شده است' };
  }
  if (Number(inv.expiresAt) < Date.now()) {
    await prisma.barbershopInvitation.update({
      where: { id: inv.id },
      data: { status: 'expired' },
    });
    return { success: false, message: 'دعوتنامه منقضی شده است' };
  }
  const invPhoneNorm = normalizePhone(inv.inviteePhone);
  const barberPhoneNorm = normalizePhone(barber.phone);
  if (invPhoneNorm !== barberPhoneNorm && inv.inviteePhone !== barber.phone) {
    return { success: false, message: 'این دعوتنامه برای شماره شما صادر نشده است' };
  }

  const barbershopId = inv.barbershopId;
  if (inv.barbershop.ownerId === barberId) {
    await prisma.barbershopInvitation.update({
      where: { id: inv.id },
      data: { status: 'accepted' },
    });
    return { success: true, message: 'شما مالک این سالن هستید', barbershopId };
  }

  const existing = await prisma.barbershopMember.findUnique({
    where: { barbershopId_barberId: { barbershopId, barberId } },
  });
  if (existing) {
    await prisma.barbershopInvitation.update({
      where: { id: inv.id },
      data: { status: 'accepted' },
    });
    return { success: true, message: 'شما قبلاً به این سالن پیوسته‌اید', barbershopId };
  }

  await prisma.$transaction([
    prisma.barbershopMember.create({
      data: {
        barbershopId,
        barberId,
        role: 'staff',
        joinedAt: BigInt(Date.now()),
      },
    }),
    prisma.barbershopInvitation.update({
      where: { id: inv.id },
      data: { status: 'accepted' },
    }),
  ]);

  return { success: true, message: 'با موفقیت به سالن پیوستید', barbershopId };
}
