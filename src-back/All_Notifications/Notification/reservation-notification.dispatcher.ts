import prisma from '../../All_Utils/config/prisma';
import { sendNotificationToUser } from './notification.service';
import { sendPatternSMS, sendSimpleSMS } from '../SMS/melipayamak.service';
import { createCustomerInAppNotification } from './customer-inapp.service';

function getEnvInt(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const v = parseInt(raw, 10);
  return Number.isFinite(v) && v > 0 ? v : null;
}

async function sendReservationSms(params: {
  phone: string;
  kind: 'reserve' | 'cancel' | 'reschedule';
  appointmentId: number;
  barbershopName?: string | null;
  timeText?: string;
}): Promise<void> {
  const reservePatternId = getEnvInt('MELIPAYAMAK_RESERVE_PATTERN_ID');
  const cancelPatternId = getEnvInt('MELIPAYAMAK_CANCEL_RESERVE_PATTERN_ID');

  // If patterns are configured, prefer them (OTP already uses pattern SMS).
  if (params.kind === 'reserve' && reservePatternId) {
    await sendPatternSMS(params.phone, reservePatternId, {
      '0': params.barbershopName ?? 'آرایشگاه',
      '1': params.timeText ?? '',
      '2': String(params.appointmentId),
    });
    return;
  }
  if (params.kind === 'cancel' && cancelPatternId) {
    await sendPatternSMS(params.phone, cancelPatternId, {
      '0': params.barbershopName ?? 'آرایشگاه',
      '1': params.timeText ?? '',
      '2': String(params.appointmentId),
    });
    return;
  }

  const text =
    params.kind === 'cancel'
      ? `رزرو شما لغو شد. (کد رزرو: ${params.appointmentId})`
      : params.kind === 'reschedule'
        ? `زمان رزرو شما تغییر کرد. (کد رزرو: ${params.appointmentId})`
        : `رزرو شما ثبت شد. (کد رزرو: ${params.appointmentId})`;
  await sendSimpleSMS({ to: params.phone, message: text });
}

export async function notifyAppointmentCreated(input: {
  appointmentId: number;
  customerId: number;
  barberId?: number | null;
  barbershopId?: number | null;
  startTimeEpochMs: number;
}): Promise<void> {
  const [customer, shop] = await Promise.all([
    prisma.customer.findUnique({ where: { id: input.customerId }, select: { phone: true } }),
    input.barbershopId ? prisma.barbershop.findUnique({ where: { id: input.barbershopId }, select: { name: true } }) : null,
  ]);

  const shopName = shop?.name ?? 'آرایشگاه';
  const timeText = new Date(input.startTimeEpochMs).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });

  await createCustomerInAppNotification({
    customerId: input.customerId,
    type: 'appointment_created',
    title: 'رزرو ثبت شد',
    body: `رزرو شما در ${shopName} برای ${timeText} ثبت شد.`,
    meta: { appointmentId: input.appointmentId },
  });

  // Push (best-effort)
  sendNotificationToUser({
    userId: input.customerId,
    userType: 'customer',
    title: 'رزرو ثبت شد',
    body: `رزرو شما برای ${timeText} ثبت شد.`,
    data: { appointmentId: String(input.appointmentId) },
  }).catch((e) => console.warn('Customer push failed:', e));

  // SMS (best-effort)
  if (customer?.phone) {
    sendReservationSms({
      phone: customer.phone,
      kind: 'reserve',
      appointmentId: input.appointmentId,
      barbershopName: shopName,
      timeText,
    }).catch((e) => console.warn('Customer SMS failed:', e));
  }
}

export async function notifyAppointmentCancelled(input: {
  appointmentId: number;
  customerId: number;
  barbershopId?: number | null;
  startTimeEpochMs: number;
}): Promise<void> {
  const [customer, shop] = await Promise.all([
    prisma.customer.findUnique({ where: { id: input.customerId }, select: { phone: true } }),
    input.barbershopId ? prisma.barbershop.findUnique({ where: { id: input.barbershopId }, select: { name: true } }) : null,
  ]);

  const shopName = shop?.name ?? 'آرایشگاه';
  const timeText = new Date(input.startTimeEpochMs).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });

  await createCustomerInAppNotification({
    customerId: input.customerId,
    type: 'appointment_cancelled',
    title: 'رزرو لغو شد',
    body: `رزرو شما در ${shopName} برای ${timeText} لغو شد.`,
    meta: { appointmentId: input.appointmentId },
  });

  sendNotificationToUser({
    userId: input.customerId,
    userType: 'customer',
    title: 'رزرو لغو شد',
    body: `رزرو شما برای ${timeText} لغو شد.`,
    data: { appointmentId: String(input.appointmentId) },
  }).catch((e) => console.warn('Customer push failed:', e));

  if (customer?.phone) {
    sendReservationSms({
      phone: customer.phone,
      kind: 'cancel',
      appointmentId: input.appointmentId,
      barbershopName: shopName,
      timeText,
    }).catch((e) => console.warn('Customer SMS failed:', e));
  }
}

export async function notifyAppointmentRescheduled(input: {
  appointmentId: number;
  customerId: number;
  barbershopId?: number | null;
  newStartTimeEpochMs: number;
}): Promise<void> {
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId }, select: { phone: true } });
  const shop = input.barbershopId ? await prisma.barbershop.findUnique({ where: { id: input.barbershopId }, select: { name: true } }) : null;

  const shopName = shop?.name ?? 'آرایشگاه';
  const timeText = new Date(input.newStartTimeEpochMs).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });

  await createCustomerInAppNotification({
    customerId: input.customerId,
    type: 'appointment_rescheduled',
    title: 'زمان رزرو تغییر کرد',
    body: `زمان رزرو شما در ${shopName} به ${timeText} تغییر کرد.`,
    meta: { appointmentId: input.appointmentId },
  });

  sendNotificationToUser({
    userId: input.customerId,
    userType: 'customer',
    title: 'زمان رزرو تغییر کرد',
    body: `زمان جدید: ${timeText}`,
    data: { appointmentId: String(input.appointmentId) },
  }).catch((e) => console.warn('Customer push failed:', e));

  if (customer?.phone) {
    sendReservationSms({
      phone: customer.phone,
      kind: 'reschedule',
      appointmentId: input.appointmentId,
      barbershopName: shopName,
      timeText,
    }).catch((e) => console.warn('Customer SMS failed:', e));
  }
}

