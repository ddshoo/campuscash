# CampusCash — Claude Code Instructions

## What this project is

CampusCash is a student personal finance web app being built as a 16-day demo for an Intuit A4A Software Engineer I interview. The original prototype was designed in a UX class at the University of Michigan based on user research with four undergrads. This build rebuilds the prototype as a working Next.js app and adds AI features (chat assistant, credit score simulator).

**This is interview prep, not a production product.** The goal is a demoable app that I can speak about with depth and conviction for 30 minutes. Optimize for clarity of intent and defensibility over completeness or polish.

## The interview context (relevant to how we work)

- The Intuit interview is a 30-minute deep dive after I demo the project.
- The panel will ask high-level architecture and trade-off questions, not line-by-line code.
- For every decision, I must be able to name the alternative I rejected and why.
- Two AI features (chat assistant + credit score simulator) are the differentiator. Intuit explicitly encourages AI-leveraged projects, and they partner with Anthropic.
- CampusCash maps directly to Intuit's "Accelerate Money Benefits" Big Bet (Credit Karma's product line).

## Tech stack (locked — do not change without explicit approval)

- **Next.js 16 (App Router) + TypeScript** — already scaffolded
- **Tailwind CSS v4** — already configured
- **Zustand** for state, persisted to localStorage (specifically chosen to solve the threshold-sync bug)
- **Recharts** for line/bar charts ONLY (the credit score gauge is custom SVG, not Recharts)
- **Vercel AI SDK** with Anthropic provider, model: `claude-sonnet-4-5`
- **shadcn/ui** only for accessible primitives (dropdown, dialog, toggle) — not as a general component library
- **Vercel** for deployment

If you need to add a dependency, ask first. State the package name and the alternative you considered.

## Build priority (revised after Opus plan review)

**4 CORE features — build and understand these cold:**
1. UI shell + bottom nav + design tokens
2. Home + Balance + Threshold editor (Zustand single source of truth)
3. Credit Score page (custom SVG gauge + history) + **Credit Score Simulator (AI)**
4. AI Chat Assistant (grounded in user data)

**2 STRETCH features — only if core is done AND understood:**
5. Mock payment flow
6. AI auto-categorization

Depth of understanding beats feature count. A deep dive rewards 4 features I can defend over 6 I built loosely. Do not start stretch features until I confirm the core is solid.

## The two interview stories this build must support

1. **User-research → problem-solving story (supporting):** The threshold bug. Original prototype didn't sync the low-balance threshold across pages; we fix it with Zustand as single source of truth. This shows I ground engineering in real user findings. It is NOT the technical centerpiece — it's a beginner-level state fix and should be framed as a product/research story, not a hard-engineering flex.
2. **Hard-technical story (centerpiece):** The AI design decisions. The credit simulator (how to model score changes from hypothetical actions — rule-based vs ML vs LLM reasoning) and the chat grounding (how to feed financial context without blowing the token budget, how to prevent hallucinated numbers). These are the genuine engineering trade-offs the deep dive should explore.

## Critical design decisions (load-bearing for the interview narrative)

1. **Mobile-first, web-deployed.** The original Figma is phone-shaped. App renders inside a `max-w-[420px] mx-auto` wrapper with a gray backdrop. Same pattern as Credit Karma and Instagram on web. Demo will use Chrome mobile emulation.
2. **No real backend.** Seeded JSON + localStorage. The honest-scope story matters more than fake production infrastructure. (Deliver this as a confident choice, never an apology.)
3. **Vertical slices, not horizontal.** Build one feature end-to-end before starting the next.
4. **Threshold editor route is `/balance/alerts`** (matches the Figma "Balance Alerts" screen), not `/balance/edit-threshold`.

## Design system from the Figma

- **Navy header:** `#0D3B66`
- **Blue card (primary balance):** `#5E8AC7`
- **Orange (accent / active states):** `#F26522`
- **Light gray background:** `#EEEEEE`
- **White cards** with rounded corners and subtle shadow
- **Red** for debits (negative amounts)
- **Green** for credits (positive amounts)
- **Bottom nav:** 4 tabs (Home, Balance, Credit, Profile). Active tab is orange icon + label; inactive tabs are navy icons.

## How to work with me

1. **Explain your plan before writing code.** For any non-trivial change, describe what you're about to do in 1-3 sentences first. I need to understand it well enough to defend it in an interview.
2. **One feature at a time.** Don't scaffold ahead. Don't add things I didn't ask for.
3. **TypeScript strictly.** No `any` types unless explicitly justified.
4. **Small commits, conventional format.** Use `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`. One feature per commit. Write commit messages that read like a changelog.
5. **Ask before adding dependencies.** State the package and the alternative considered.
6. **Never run `git push`.** I'll do that manually.
7. **When you hit a bug, surface it.** Don't quietly work around something weird. Tell me what happened so I can log it in my Bug Log (this matters for "tell me about a bug you debugged" in the interview).
8. **Don't write code I can't explain.** If you're using a pattern I haven't seen, briefly explain it in a comment or in your response.

## Out of scope (do not propose these unprompted)

- Real authentication (NextAuth, OAuth, magic links)
- Real bank API integration (Plaid)
- Push notifications
- React Native / native mobile
- Server-side database (Postgres, Prisma, Supabase)
- Desktop responsive layouts
- Internationalization
- Dark mode
- E2E testing infrastructure (we'll add lightweight test scaffolding only if time permits in week 2)

If something seems important and is on this list, mention it as "deferred" in a comment or note, but don't build it.

## What's already done

- Next.js 16 + TypeScript + Tailwind v4 scaffold
- Git repo initialized, pushed to https://github.com/ddshoo/campuscash
- `SPEC.md` and `STUDY_SHEET.md` live in the parent folder

## What we're building today

The mobile-first wrapper, bottom nav, Tailwind design tokens, and empty page shells for all routes (/, /balance, /balance/alerts, /transactions, /credit, /profile, /assistant). After this is done, the app should look like a phone-shaped shell with working tab navigation but no feature content yet.

Note: Transaction History (`/transactions`) is built as a shell now since it's reachable from the Balance page's History button, but full transaction features are lower priority than the 4 core features. Build the shell; defer rich functionality.
