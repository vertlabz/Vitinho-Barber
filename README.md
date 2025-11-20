# Barbearia Backend

Scaffolded Node.js + TypeScript + Prisma backend for a single-tenant barbearia app.

Quick start (local, using docker-compose):

```powershell
cp .env.example .env
docker-compose up -d
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Endpoints:
- `GET /bookings?date=YYYY-MM-DD` - list appointments for a day
- `POST /bookings` - create an appointment (see `src/controllers/bookings.ts`)
# Vitinho-Barber
App de agendamento para Vitinho Barber
