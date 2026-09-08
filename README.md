# Touché — Master Recipe Dashboard

A Next.js + Supabase rebuild of the Touché candle recipe catalog. Same card
grid, dual status system, launch-phase bubbles, and candle lineage tracking
as the original single-file HTML dashboard — but now backed by a real
Postgres database, so edits are saved permanently, sync in real time across
your team, and work from any browser or device.

## Stack

- **Next.js** (App Router, TypeScript) — deployed on Vercel
- **Supabase** (Postgres + Auth + Realtime) — the database and login
- Plain CSS ported 1:1 from the original dashboard (no UI framework) — same
  oxblood/brass palette, Suranna candle names, card layout, and modal

## How lineage (`derivedFrom`) is modeled

Candle numbers in this catalog are **not unique** — two historical entries
are both numbered `"0"`. Because of that, `derived_from` is stored as a
plain **text column holding the parent's `number`**, not a database foreign
key: an FK would be ambiguous whenever a number is duplicated. Lineage is
resolved the same way the original dashboard did it — by matching text on
`number` at read time (see `findByNumber` / `getChildren` in
`lib/candleHelpers.ts`) — which is what powers the "Descended from #X" badge
and its click-to-jump behavior, and the "→ Inspired #Y, #Z" list on a
parent's card.

## One-time setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and open
**Settings → API** to get your project URL and keys.

### 2. Run the schema migrations

Open the Supabase SQL Editor and run each file in `supabase/migrations/`,
**in order**, as its own query:

1. `0001_init.sql` — creates the `candles` table, its indexes, the
   `updated_at`/`updated_by` triggers, Row Level Security policies (any
   signed-in user can read/write — see below), and enables Realtime.
2. `0002_add_seasonal_tags.sql` — adds the `seasonal_tags` column (a text
   array) used for the card-front seasonal badges.
3. `0003_multi_secondary_status.sql` — converts `secondary_status` (one
   value) into `secondary_statuses` (an array), so a candle can carry more
   than one at once. Preserves any existing secondary status as a
   one-element array before dropping the old column.

On a brand-new project just run them both back to back. On a project that
already ran `0001_init.sql` in production, only run the new one(s) — each
migration is written to be safe to run on its own, and safe to re-run if
you're ever unsure whether it already applied.

### 3. Create accounts for your team

In **Authentication → Users**, click **Add user** for each of your 2-3 team
members (email + password; you can send a magic link instead if you'd
rather they set their own password). There's no public sign-up page in this
app on purpose — accounts are created here, in the Supabase dashboard, not
in the app itself.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
Settings → API. For the one-time seed step below you'll also need the
**service role** key (Settings → API → `service_role` secret) — keep that
one out of Vercel and out of git; it's only used locally.

### 5. Seed the original 73 candles

```bash
npm install
npm run seed
```

This loads `supabase/seed-data.json` (extracted from the original
dashboard's `window.__DASHBOARD_DATA__` blob, in original card order) into
the `candles` table via `scripts/seed.mjs`. Safe to re-run — it clears the
table first unless you pass `--keep`.

### 6. Run it locally

```bash
npm run dev
```

Visit `http://localhost:3000`, sign in with one of the accounts you created
in step 3.

## Deploying to Vercel

1. Push this repo to GitHub (or your Git provider of choice).
2. Import it into Vercel.
3. Add the two `NEXT_PUBLIC_*` environment variables from `.env.local` to
   the Vercel project (Project Settings → Environment Variables). **Do not**
   add `SUPABASE_SERVICE_ROLE_KEY` to Vercel — it's not needed at runtime,
   only for the local seed script.
4. Deploy. Every team member hits the same Vercel URL and signs in with
   their Supabase account.

## Multi-user editing

- Row Level Security is scoped to "any authenticated user can read and
  write the whole catalog" — this is a small trusted team sharing one
  catalog, not a multi-tenant app, so there's no per-row ownership model.
- The dashboard subscribes to Supabase Realtime on the `candles` table, so
  when one teammate edits a card, cycles its launch phase, or adds a new
  candle, everyone else's open dashboard updates live without a refresh.
- Every row also has `created_by` / `updated_by` (Supabase auth user id),
  stamped automatically by a database trigger, if you ever want to add an
  "edited by" display later.

## Feature parity with the original dashboard

- Card grid, color-coded by `label` (keyword-matched to a hex, or an
  explicit `color_override_hex`) with auto-contrast text
- Suranna font for candle names, same oxblood/brass/cream palette
- Dual status system: primary (Fill / Kill / Pending Creation / Revisit) +
  secondary (Re-smell / Review Throw / Review Wick / Review Melt / Check
  For Overlaps / Dead / Check Complete) — secondary status can hold more
  than one at once, see "Added since the original dashboard" below
- P1/P2/P3 launch-phase bubble, top right of each card, cycles on click
- "Descended from #X" badge + "→ Inspired #Y, #Z" list, both click-to-jump
- Search by name, number, or ingredient; filter by primary status,
  secondary status, and scent family (multi-select chips + dropdown)
- Full recipe modal with every field from the original, including
  ingredients (grams), fragrance load, batch size, wax, wick, add/pour
  temp, depth & complexity suggestion, notes, and lineage
- Stats bar: total / active / killed
- "Reset data" — restores the original 73-candle import for the whole team
  (destructive; confirms first)

## Added since the original dashboard

- **Seasonal tags** — up to 3 free-text labels per candle (e.g. "Holiday",
  "Valentine's", "Summer Launch"), added/removed in the recipe modal and
  shown as brass badges on the card front, next to the status badges
- **Sort** — a dropdown next to the scent-family filter: name (A–Z), candle
  number, launch phase (P1 → P2 → P3, unset last), or recently updated
- **Multi-select secondary status** — the recipe modal's secondary status
  dropdown now allows selecting more than one (⌘/Ctrl-click, or Shift-click
  for a range), so a candle can carry more than one at once (e.g. both
  "Re-smell" and "Review Throw"); the card front shows a badge per status,
  and the secondary-status filter chips match a candle that has *any* of
  the active chips selected
- **Label color picker** — the recipe modal's "Label color override (hex)"
  field now has a real color swatch/picker next to the hex text input,
  showing the exact color the card will render (either your override or,
  if left blank, the auto-match from the label name) instead of guessing
  from a hex code typed blind

## Project structure

```
app/
  layout.tsx          Fonts (Suranna, Cormorant Garamond, Inter, IBM Plex Mono), metadata
  globals.css          All styling, ported from the original dashboard
  page.tsx              Server component: loads candles, renders <Dashboard>
  login/                Login page + sign-in/sign-out server actions
components/
  Dashboard.tsx         Client component: filters, realtime sync, CRUD
  CandleCard.tsx         Single recipe card
  CandleModal.tsx        Add/edit/delete form
  ChipRow.tsx             Multi-select status/secondary-status chip filters
lib/
  types.ts                Candle type + status enums
  candleHelpers.ts          Color logic, filters, lineage lookups, phase cycling
  supabase/                 Browser + server Supabase clients
supabase/
  migrations/0001_init.sql    Schema, RLS, triggers, realtime
  migrations/0002_add_seasonal_tags.sql   Adds the seasonal_tags column
  migrations/0003_multi_secondary_status.sql   secondary_status -> secondary_statuses[]
  seed-data.json                The original 73 candles, ready to seed
scripts/seed.mjs                 Seed script (service role key)
proxy.ts                          Session refresh + auth route protection
```
