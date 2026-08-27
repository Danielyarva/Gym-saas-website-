# AI Coach OS

AI-powered operating system for fitness, transformation, and personal coaches. Coaches manage clients, build workout/nutrition plans, and review check-ins; clients track progress and chat with an AI coach.

See `CLAUDE.md` for the working process and `docs/PRD.md` for the full product/technical specification.

## Status

Not yet scaffolded — Phase 1 (auth, coach dashboard, client management, client profile) is being planned.

## Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **AI**: Claude (Anthropic API) behind an `AIProvider` abstraction
