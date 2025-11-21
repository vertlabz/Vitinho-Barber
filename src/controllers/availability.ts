// src/controllers/availability.ts
import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { DateTime } from 'luxon';
import { z } from 'zod';

const querySchema = z.object({
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  stepMinutes: z.coerce.number().optional(), // step between slots
});

export async function getAvailabilityHandler(req: Request, res: Response) {
  try {
    const parsed = querySchema.parse(req.query);
    const serviceId = parsed.serviceId;
    const date = parsed.date;
    const stepMinutes = parsed.stepMinutes ?? 30;

    // buscar duração do serviço
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(400).json({ error: 'Service not found' });
    const duration = service.durationMinutes;

    // timezone da barbearia (use .env se quiser)
    const BARBEARIA_TZ = process.env.BARBEARIA_TIMEZONE ?? 'America/Sao_Paulo';

    // janela padrão do dia (09:00 - 18:00) — você pode ler isso do DB depois
    const workStartLocal = DateTime.fromISO(`${date}T09:00:00`, { zone: BARBEARIA_TZ });
    const workEndLocal = DateTime.fromISO(`${date}T18:00:00`, { zone: BARBEARIA_TZ });

    // buscar agendamentos daquele dia (em UTC, convertendo janela local para UTC)
    const dayStartUtc = workStartLocal.toUTC().toJSDate();
    const dayEndUtc = workEndLocal.toUTC().toJSDate();

    const appointments = await prisma.appointment.findMany({
      where: {
        AND: [
          { status: { in: ['pending', 'confirmed'] } },
          {
            OR: [
              { startAt: { gte: dayStartUtc, lt: dayEndUtc } },
              { endAt: { gt: dayStartUtc, lte: dayEndUtc } },
              {
                AND: [
                  { startAt: { lte: dayStartUtc } },
                  { endAt: { gte: dayEndUtc } }
                ]
              }
            ]
          }
        ]
      }
    });

    const slots: string[] = [];
    let cursor = workStartLocal;

    while (cursor.plus({ minutes: duration }).toMillis() <= workEndLocal.toMillis()) {
      const slotStartLocal = cursor;
      const slotEndLocal = cursor.plus({ minutes: duration });

      const slotStartUtc = slotStartLocal.toUTC();
      const slotEndUtc = slotEndLocal.toUTC();

      // verifica conflito
      const conflict = appointments.some(appt => {
        const apptStart = DateTime.fromJSDate(appt.startAt, { zone: 'utc' });
        const apptEnd = DateTime.fromJSDate(appt.endAt, { zone: 'utc' });
        return apptStart < slotEndUtc && apptEnd > slotStartUtc;
      });

      if (!conflict) {
        const iso = slotStartUtc.toISO();
        slots.push(iso ?? slotStartUtc.toString());
      }

      cursor = cursor.plus({ minutes: stepMinutes });
    }

    return res.json({
      date,
      timezone: BARBEARIA_TZ,
      availableSlots: slots
    });
  } catch (err: any) {
    console.error('availability error', err);
    return res.status(400).json({ error: err?.message ?? 'Invalid request' });
  }
}
