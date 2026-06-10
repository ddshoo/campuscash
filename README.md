# CampusCash

A mobile-first personal finance web app for college students. Built as a demo project for an Intuit interview, grounded in user research conducted at the University of Michigan.

## Origin

Designed in a UX class based on interviews with four undergrads. The central finding: students check their balance on their phone right before spending, but their bank app is slow and buried under notifications. A recurring pain point was that low-balance alerts were misconfigured — the threshold was set in one place but the warning showed up somewhere else, so students didn't trust it.

That sync bug is the engineering thread running through this project. The threshold editor writes to a single Zustand store; every page that reads balance data subscribes to the same state. Set a threshold once, and the warning banner on Home, the alert badge on Balance, and the Notifications page all update immediately.

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | File-based routing, Server Components, first-class API routes |
| Styling | Tailwind CSS v4 | Design token system via `@theme`; no runtime CSS |
| State | Zustand + `persist` middleware | Minimal API, localStorage persistence, solves the threshold-sync bug without Redux overhead |
| Charts | Recharts | Composable, React-native, sufficient for line + bar charts |
| Credit gauge | Custom SVG | Recharts has no arc/gauge primitive; SVG arc math gives full control over zone coloring |
| AI | Vercel AI SDK v6 + `@ai-sdk/anthropic` | Streaming protocol, `useChat` hook, compatible with Next.js App Router |
| Model | `claude-sonnet-4-5` | Anthropic's balanced model — fast enough for chat, capable enough for financial reasoning |
| Deployment | Vercel | Zero-config Next.js hosting |

## Features

**Home** — Balance card, low-balance warning banner (threshold-driven), last 5 transactions, AI assistant entry point.

**Balance** — Scrollable bank cards (multi-account), threshold editor shortcut, transaction history.

**Balance Alerts** — Threshold editor. The core demo of Zustand as single source of truth: editing the threshold here propagates to every page instantly via store subscription.

**Credit Score** — Custom SVG arc gauge with four FICO zones, 6-month history line chart, credit factors list, score simulator.

**Transactions** — Full transaction list with category filter chips and spending-by-category bar chart.

**Notifications** — Live low-balance notification card when balance < threshold; empty state otherwise.

**Profile** — Account info, linked accounts, credit cards.

## AI Features

### Chat Assistant (`/assistant` → `/api/chat`)

Uses Vercel AI SDK's `streamText` with streaming UI via `useChat`. On every message, the client sends a `financialContext` object alongside the conversation — balance, threshold, credit score, and all 10 transactions. The API route builds a system prompt that injects this snapshot, then calls Claude.

Key design decisions:
- **Grounding over RAG.** With 10 transactions and a handful of numbers, injecting everything into the system prompt is cheaper and simpler than a retrieval pipeline. Token cost is ~600 tokens per request.
- **Hallucination prevention.** The system prompt explicitly states: *"never cite numbers that do not appear below"* and repeats key values. Claude's instruction-following makes this reliable for demo-scale data.
- **Prompt injection resistance.** Relies on Claude's RLHF training rather than a keyword filter. The demo screenshot shows "ignore all previous instructions" being correctly deflected.

### Credit Score Simulator (`/credit` → `/api/simulate`)

Uses `generateText` (not streaming) since the response is a short JSON object. The system prompt acts as a FICO scoring expert with explicit numeric ranges per action type. Claude returns raw JSON; the route strips any markdown fences before parsing.

**Rule-based vs. LLM tradeoff:** A lookup table (`{ "pay off card": +20 }`) would be deterministic but can't handle novel queries ("What if I consolidate my student loans into one account?"). The LLM approach handles arbitrary natural language at the cost of non-determinism — acceptable for a simulator, not for a real scoring engine.

Response shape:
```ts
{ hypotheticalScore: number, delta: number, explanation: string }
```

## Architecture Decisions

| Decision | Choice | Alternative rejected | Why |
|---|---|---|---|
| Persistence | Custom window-guarded storage | `createJSONStorage(() => localStorage)` | `createJSONStorage` calls the getter at module eval time; during Next.js SSR the module is evaluated on the server where `localStorage` throws, returning `undefined`. Persist silently no-ops. |
| AI SDK transport | `DefaultChatTransport` with function body | Static `body` object | A function body ensures `financialContext` is read from the ref at request time, not captured stale at hook initialization. |
| Simulator response | `generateText` + JSON | Streaming | Streaming a JSON object is pointless — you can't parse partial JSON. Single-shot response is simpler and correct. |
| State scope | Zustand module singleton | Per-component state | Threshold needs to be readable by Home, Balance, and Notifications simultaneously. Module-level singleton is the natural solution. |
| No backend | Seeded JSON + localStorage | Supabase / Prisma | Honest scope for a demo. The architecture story is more defensible than a fake production database. |

## Setup

```bash
git clone https://github.com/ddshoo/campuscash
cd campuscash
npm install
```

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run dev
# Open http://localhost:3000
# Use Chrome DevTools → mobile emulation for the intended viewport (420px)
```

## What Would Be Different in Production

**Authentication.** No auth currently — profile data is seeded. Production would use NextAuth or Clerk with a real user session.

**Bank data.** Transactions are seeded JSON. Production would use Plaid or a similar aggregation API. The store shape is already compatible — swap seed data for API response.

**Persistent storage.** localStorage works for a single device but doesn't sync across devices. Production would move Zustand persistence to a user-scoped database (Postgres + Prisma) with localStorage as a write-through cache.

**AI context scaling.** At 10 transactions, full-context injection is fine. At 500+ transactions, you'd need a retrieval step — embed transactions, query by semantic similarity to the user's message, inject only the top-k results. The system prompt interface stays the same; the context-building layer changes.

**Credit score data.** The gauge and simulator use a hardcoded FICO score. Production would pull from a bureau API or Credit Karma's data layer.

**Markdown rendering.** Assistant responses contain markdown (`**bold**`) rendered as raw text. Production would add `react-markdown` to the message renderer.
