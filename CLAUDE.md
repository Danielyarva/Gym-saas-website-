@AGENTS.md

# AI Coach OS

Fitness/transformation coaching SaaS. Coaches manage clients, workout/nutrition plans, and check-ins; clients track progress and use an AI chat coach. Full spec: `docs/PRD.md`.

## Current phase

Phase 1 complete — authentication, coach dashboard, client management, client profile (PRD §7–10, §36) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile).

Phase 2 complete — client account invites, onboarding, the exercise library, workout plan builder, nutrition plan builder, daily check-ins, and the client app shell (PRD §11–14) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile). Along the way, fixed two role-handling gaps Phase 1 never needed: `(dashboard)/layout.tsx` had no role gate, and `/login` always redirected to `/dashboard` regardless of role.

Phase 3 complete — progress charts (weight, body measurements, steps, sleep, workout/nutrition adherence) with a time-range selector, progress photos with before/after comparison, and periodic body-measurement logging via the daily check-in (PRD §15) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile). `CoachClient.adherencePct`/`progressPct` — dead/always-null since Phase 1 — now get recomputed on every check-in submit, so the Overview and dashboard "Adherence"/"Average Progress" stats are real for the first time. No AI-generated weekly report (that's Phase 4's PRD §19 narrative version); the Weekly chart range plus check-in history already cover the same ground without AI.

Phase 4 complete — AI Coach chat, automatic post-check-in risk analysis, and coach-triggered weekly reports (PRD §16–19, §29–30) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile). Every AI call goes through one `aiService` wrapper (Anthropic behind an `AIProvider` interface, structured output via forced tool-use, Zod-revalidated) that degrades to a clean `AI_NOT_CONFIGURED` (503) with a usage-log row whenever no `ANTHROPIC_API_KEY` is set — true throughout this sandbox, so the phase never exercised a real model response; add a key later and nothing else changes. Risk detection (§18) lives inside the same `AiInsight` row as progress analysis (§17), not a separate pipeline. Weekly reports are coach-triggered (no job queue until Phase 7), with only the narrative from AI — all metrics computed deterministically from existing check-in data.

Phase 5 complete — coach-client messaging (conversations, read/unread, a polling-based typing indicator, image attachments) and a notification center (PRD §20–21) are implemented on both frontend and backend, code-reviewed, and verified end-to-end in a real browser (desktop + mobile). Messages are a flat `Message` table keyed by `clientId` — no `Conversation` wrapper, since a coach has exactly one client per relationship. Both roles read and write the same thread for the first time in this app (`requireClientOwnershipOrSelf()` now gates a POST, not just reads). Typing indicators use two ephemeral timestamp columns on `CoachClient`, polled via REST per PRD's explicit "no WebSockets yet." Notifications fire for check-ins, missed workouts, AI at-risk analysis (RED only), weekly reports, and new messages, with email sent only for the two urgent types (new message, at-risk). Along the way, relabeled Phase 4's per-client "Chat" tab to "AI Coach" to disambiguate it from this phase's new "Messages" tab, and discovered mid-build that Next.js route groups don't namespace URLs — the client app's Messages/Notifications pages live at `/inbox` and `/alerts` rather than colliding with the coach's `/messages` and `/notifications`.

Next up: Phase 6 — subscriptions, payments (PRD §24 and phase breakdown). Start it in plan mode per the working process below.

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
