# TradeLog — Claude Context

## Project Overview

**TradeLog** is a Forex Trading Journal & Analytics web application for forex traders to log trades, analyze performance, and improve their trading psychology. The UI is primarily in **Vietnamese**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI primitives) |
| State (server) | TanStack React Query v5 |
| State (client) | Zustand v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Icons | Lucide React |
| Notifications | Sonner (toasts) |

## Key Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint check (also runs as pre-commit hook via Husky)
npm run preview   # Preview production build
```

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-supabase-anon-key>
```

## Project Structure

```
src/
├── app/              # App entry, routes, providers, auth guard
├── components/
│   ├── layout/       # Sidebar, Header, DashboardLayout (desktop + mobile)
│   ├── shared/       # ErrorBoundary, LoadingSpinner
│   └── ui/           # shadcn/ui component library
├── features/
│   ├── auth/         # Login, SignUp pages
│   ├── trades/       # Trade create/close/detail/list + screenshot annotation
│   ├── journal/      # Daily trading journal entries
│   ├── rules/        # Trading rules & pre-trade checklist
│   └── dashboard/    # Analytics: win rate, P&L chart, error tag breakdown
├── stores/           # Zustand stores (app state: sidebar, theme, period filter)
├── lib/              # Supabase client, constants, helper utilities
├── types/            # TypeScript type definitions
└── styles/           # Global CSS (Tailwind)

supabase/
└── migrations/       # SQL schema migrations (apply via Supabase CLI or dashboard)
```

## Database Schema (Supabase / PostgreSQL)

All tables use Row-Level Security (RLS) — users can only access their own data.

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (email, display_name) — auto-created on signup via trigger |
| `trading_rules` | User-defined pre-trade rules (text, sort_order, is_active) |
| `trades` | Trade records (pair, direction, lot, entry/exit price, SL, TP, P&L, screenshots, annotations, error_tags) |
| `daily_journals` | Daily session notes (mood score 1–10, session type, macro events, summary) |
| `checklist_logs` | Which trading rules were checked for each trade |

**Migrations:**
- `001_initial_schema.sql` — Full schema with RLS policies, indexes, auth trigger
- `002_add_annotations.sql` — Added JSONB `annotations` column to `trades`

## Core Features

### Trades
- Supported pairs: XAUUSD, EURUSD, GBPUSD, USDJPY, AUDUSD, USDCHF, USDCAD, NZDUSD, GBPJPY, EURJPY
- Directions: BUY / SELL
- Status: OPEN → CLOSED (WIN / LOSS / BREAK_EVEN)
- Error tags: FOMO, slippage, overtrading, revenge trade, etc.
- Screenshot upload → Supabase Storage
- Chart annotation: SVG overlay with draggable buy/sell markers and custom lines (stored as JSONB)

### Daily Journal
- One entry per user per date (unique DB constraint)
- Session types: ASIAN, EUROPEAN, US
- Mood score 1–10, mood notes, session notes, macro events, daily summary

### Trading Rules / Checklist
- User-defined rules with sort order and active/inactive toggle
- Pre-trade checklist shown during trade creation — logs are saved to `checklist_logs`

### Dashboard
- Win rate, cumulative P&L (USD + pips), best/worst trade, current streak, R:R ratio
- P&L chart (Recharts line chart by date)
- Error tag breakdown (pie chart)
- Period filter: Week / Month / All-time

## Architecture Patterns

- **Feature-based folder structure** — each feature is self-contained under `src/features/`
- **React Query** for all Supabase data fetching, caching, and mutations
- **Zustand** for lightweight client-only UI state (sidebar, theme, period filter)
- **Zod schemas** for form validation; types are inferred from schemas where possible
- **Code splitting** — pages are lazy-loaded via `React.lazy()` + `Suspense`
- **Responsive layout** — sidebar nav on desktop, bottom tab bar on mobile
- **Dark mode** — default dark theme, stored in Zustand + localStorage

## Path Aliases

`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

## Code Style & Conventions

- TypeScript strict mode — avoid `any`
- Use `cn()` from `src/lib/utils.ts` for merging Tailwind classes
- shadcn/ui components live in `src/components/ui/` — do not edit generated files directly; re-generate with `npx shadcn@latest add <component>`
- Toast notifications via `import { toast } from 'sonner'`
- Supabase client is a singleton at `src/lib/supabase.ts`
- All user-facing strings are in **Vietnamese**

## Gotchas & Notes

- Husky runs `npm run lint` on pre-commit — fix all ESLint errors before committing
- `VITE_` prefix is required for env vars to be exposed in the browser
- Supabase RLS must be enabled on all tables — never disable RLS in production
- Screenshot annotations are stored as JSONB in `trades.annotations`; the shape is `{ markers: Marker[], lines: Line[] }`
- The `profiles` table is auto-populated by a Supabase database trigger on `auth.users` insert — do not insert profiles manually
