import prisma from '../../All_Utils/config/prisma';
import { dispatchAppointmentReminder } from './appointment-reminder.service';

export function startAppointmentReminderWorker(opts?: { pollIntervalMs?: number; batchSize?: number }) {
  const pollIntervalMs = opts?.pollIntervalMs ?? 30_000;
  const batchSize = opts?.batchSize ?? 50;

  async function tick() {
    const now = BigInt(Date.now());
    try {
      const due = await prisma.appointmentReminder.findMany({
        where: { sent: false, sendAt: { lte: now } },
        take: batchSize,
        orderBy: { sendAt: 'asc' },
        include: {
          appointment: {
            select: {
              id: true,
              customerId: true,
              barbershopId: true,
              startTime: true,
              status: true,
            },
          },
        },
      });

      for (const r of due) {
        const apt = r.appointment;
        if (!apt) {
          await prisma.appointmentReminder.update({ where: { id: r.id }, data: { sent: true } });
          continue;
        }

        if (['cancelled', 'completed', 'no_show'].includes(String(apt.status))) {
          await prisma.appointmentReminder.update({ where: { id: r.id }, data: { sent: true } });
          continue;
        }

        if (r.channel === 'in_app' || r.channel === 'push' || r.channel === 'sms') {
          // Dispatch once per reminder row; service best-effort sends all channels.
          await dispatchAppointmentReminder({
            appointmentId: apt.id,
            customerId: apt.customerId,
            barbershopId: apt.barbershopId,
            startTimeEpochMs: Number(apt.startTime),
          });
        }

        await prisma.appointmentReminder.update({ where: { id: r.id }, data: { sent: true } });
      }
    } catch (error) {
      console.error('Reminder worker tick failed:', error);
    }
  }

  // Immediate tick, then interval
  tick().catch(() => {});
  const handle = setInterval(() => tick().catch(() => {}), pollIntervalMs);
  return () => clearInterval(handle);
}

