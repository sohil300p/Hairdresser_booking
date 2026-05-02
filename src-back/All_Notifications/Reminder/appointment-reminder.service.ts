import prisma from '../../All_Utils/config/prisma';
import { sendNotificationToUser } from '../Notification/notification.service';
import { sendSimpleSMS } from '../SMS/melipayamak.service';
import { createCustomerInAppNotification } from '../Notification/customer-inapp.service';

export async function scheduleAppointmentReminders(input: {
  appointmentId: number;
  startTimeEpochMs: number;
  reminderScheduleMinutes: number[];
}): Promise<void> {
  const now = Date.now();
  const sendAtTimes = input.reminderScheduleMinutes
    .map((m) => input.startTimeEpochMs - m * 60 * 1000)
    .filter((t) => t > now);

  if (sendAtTimes.length === 0) return;

  // Idempotency: delete unsent reminders and recreate.
  await prisma.appointmentReminder.deleteMany({
    where: { appointmentId: input.appointmentId, sent: false },
  });

  const rows = [];
  for (const sendAt of sendAtTimes) {
    // v1: schedule all channels; dispatcher will best-effort send.
    rows.push(
      { appointmentId: input.appointmentId, channel: 'in_app', sendAt: BigInt(sendAt), sent: false, created: BigInt(Date.now()) },
      { appointmentId: input.appointmentId, channel: 'push', sendAt: BigInt(sendAt), sent: false, created: BigInt(Date.now()) },
      { appointmentId: input.appointmentId, channel: 'sms', sendAt: BigInt(sendAt), sent: false, created: BigInt(Date.now()) }
    );
  }

  await prisma.appointmentReminder.createMany({ data: rows as any });
}

export async function dispatchAppointmentReminder(input: {
  appointmentId: number;
  customerId: number;
  barbershopId?: number | null;
  startTimeEpochMs: number;
}): Promise<void> {
  const shop = input.barbershopId
    ? await prisma.barbershop.findUnique({ where: { id: input.barbershopId }, select: { name: true } })
    : null;

  const shopName = shop?.name ?? 'آرایشگاه';
  const timeText = new Date(input.startTimeEpochMs).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });

  await createCustomerInAppNotification({
    customerId: input.customerId,
    type: 'appointment_reminder',
    title: 'یادآوری رزرو',
    body: `یادآوری: رزرو شما در ${shopName} برای ${timeText} است.`,
    meta: { appointmentId: input.appointmentId },
  });

  sendNotificationToUser({
    userId: input.customerId,
    userType: 'customer',
    title: 'یادآوری رزرو',
    body: `رزرو شما برای ${timeText} است.`,
    data: { appointmentId: String(input.appointmentId) },
  }).catch((e) => console.warn('Reminder push failed:', e));

  const customer = await prisma.customer.findUnique({ where: { id: input.customerId }, select: { phone: true } });
  if (customer?.phone) {
    sendSimpleSMS({
      to: customer.phone,
      message: `یادآوری: رزرو شما برای ${timeText} است. (کد رزرو: ${input.appointmentId})`,
    }).catch((e) => console.warn('Reminder SMS failed:', e));
  }
}

