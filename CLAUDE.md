# AI Coach OS

Fitness/transformation coaching SaaS. Coaches manage clients, workout/nutrition plans, and check-ins; clients track progress and use an AI chat coach. Full spec: `docs/PRD.md`.

## Current phase

Phase 1 — Authentication, coach dashboard, client management, client profile (PRD §7–10, §36).

> Update this line yourself as each phase finishes, e.g. "Phase 2 — Onboarding, workout plans, nutrition plans, daily check-ins (PRD §11–14)."

## Working process

- Read only the PRD sections relevant to the current phase before starting — not the whole file.
- Start each phase in plan mode. Wait for explicit approval on the plan before writing code.
- Follow PRD §41's per-phase checklist: explain what's being built → create files → complete code → where each file belongs → install commands → migration commands → test instructions → verify integration with the previous phase.
- The app must stay runnable after every phase — no half-wired features left broken.
- When a phase is done: commit, then run the diff through the code-reviewer subagent before starting the next phase.

## Stack

- Frontend: Next.js, TypeScript, Tailwind, shadcn/ui, Zustand, TanStack Query, Recharts (PRD §4)
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL — controller → service → repository, no business logic in routes (PRD §5)
- AI: Claude via Anthropic API, behind the AIProvider abstraction (PRD §29)

## Conventions

- No `any`. Zod schemas for all runtime validation — request bodies and AI output alike.
- No hardcoded plan limits, API URLs, or secrets — config/env only.
- A coach can only ever access their own clients. This is a security invariant, not just a feature — test it explicitly (PRD §32).
- Every new screen needs loading, empty, and error states (PRD §38).

## Design references

Reference screenshots live in `docs/design/`. Match their colors, spacing, and component patterns exactly rather than reinterpreting them. For any screen not covered by a reference, extrapolate from the closest one instead of introducing a new visual style.
