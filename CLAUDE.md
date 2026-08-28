@AGENTS.md

# AI Coach OS

Fitness/transformation coaching SaaS. Coaches manage clients, workout/nutrition plans, and check-ins; clients track progress and use an AI chat coach. Full spec: `docs/PRD.md`.

## Current phase

Phase 1 complete — authentication, coach dashboard, client management, client profile (PRD §7–10, §36) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile).

Phase 2 complete — client account invites, onboarding, the exercise library, workout plan builder, nutrition plan builder, daily check-ins, and the client app shell (PRD §11–14) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile). Along the way, fixed two role-handling gaps Phase 1 never needed: `(dashboard)/layout.tsx` had no role gate, and `/login` always redirected to `/dashboard` regardless of role.

Phase 3 complete — progress charts (weight, body measurements, steps, sleep, workout/nutrition adherence) with a time-range selector, progress photos with before/after comparison, and periodic body-measurement logging via the daily check-in (PRD §15) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile). `CoachClient.adherencePct`/`progressPct` — dead/always-null since Phase 1 — now get recomputed on every check-in submit, so the Overview and dashboard "Adherence"/"Average Progress" stats are real for the first time. No AI-generated weekly report (that's Phase 4's PRD §19 narrative version); the Weekly chart range plus check-in history already cover the same ground without AI.

Next up: Phase 4 — AI Coach, AI check-in analysis, AI insights, AI weekly reports (PRD §16–19 and phase breakdown). Start it in plan mode per the working process below.

> Update this line yourself as each phase finishes.

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
