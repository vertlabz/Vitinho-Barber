import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';

const createBookingSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  startAt: z.string().datetime()
});

export async function createBookingHandler(req: Request, res: Response) {
  try {
    const data = createBookingSchema.parse(req.body);
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) return res.status(400).json({ error: 'Service not found' });

    const start = new Date(data.startAt);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // Transaction: check conflict then create
    const result = await prisma.$transaction(async (tx) => {
      // conflict check
      const conflicts = await tx.$queryRaw`
        SELECT 1 FROM "Appointment"
        WHERE "staffId" = ${data.staffId}
          AND "status" IN ('pending','confirmed')
          AND tstzrange("startAt","endAt") && tstzrange(${start},${end})
        LIMIT 1;
      `;
      if ((conflicts as any[]).length > 0) {
        throw new Error('Conflito de horário');
      }

      // upsert client
      const client = await tx.client.upsert({
        where: { email: data.email ?? '__temp_' + (data.phone ?? '') },
        create: { name: data.name, phone: data.phone, email: data.email },
        update: { name: data.name, phone: data.phone }
      });

      const appt = await tx.appointment.create({
        data: {
          clientId: client.id,
          staffId: data.staffId,
          serviceId: data.serviceId,
          startAt: start,
          endAt: end
        }
      });

      return appt;
    });

    return res.status(201).json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message ?? 'Invalid request' });
  }
}

export async function listBookingsHandler(req: Request, res: Response) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Missing date param YYYY-MM-DD' });
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const appts = await prisma.appointment.findMany({
    where: { startAt: { gte: dayStart, lte: dayEnd } },
    include: { client: true, service: true, staff: true }
  });
  res.json(appts);
}
