# AI Coach OS

AI-powered operating system for fitness, transformation, and personal coaches. Coaches manage clients, build workout/nutrition plans, and review check-ins; clients track progress and chat with an AI coach.

See `CLAUDE.md` for the working process and `docs/PRD.md` for the full product/technical specification.

## Status

Phase 1 (auth, coach dashboard, client management, client profile) is implemented on both the frontend and backend.

## Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, Recharts — repo root
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL — `backend/`
- **AI**: Claude (Anthropic API) behind an `AIProvider` abstraction (Phase 4+)

## Development

**Backend** (`backend/`): copy `.env.example` to `.env`, point `DATABASE_URL` at a local Postgres instance, then:

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev        # http://localhost:4000
```

Run the backend test suite (uses a separate database — see `.env.test.example`):

```bash
cd backend
cp .env.test.example .env.test   # fill in secrets, point DATABASE_URL at a test database
npx prisma migrate deploy        # against the test database (see script below)
npm test
```

**Frontend** (repo root): copy `.env.local.example` to `.env.local`, then:

```bash
npm install
npm run dev         # http://localhost:3000
```

The frontend expects the backend running at `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).
