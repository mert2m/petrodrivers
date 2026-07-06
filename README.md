# PetroDrivers

A premium iOS + Android app for discovering scenic and technical **driving roads** on a
difficulty-colored map — save favorites, and lightly log the roads you've driven. Legal, scenic,
enjoyable driving discovery. **Not a racing app:** no speed, lap, or pace metrics anywhere.

> Dark-mode only · black glassmorphism · orange accent · Apple-like interactions.

## Stack

Expo SDK 57 (managed) · Expo Router · TypeScript (strict) · Supabase (Postgres/PostGIS, Auth, Storage,
Edge Functions) · Mapbox (`@rnmapbox/maps`) · TanStack Query · Zustand · NativeWind v4 · Reanimated v4 ·
Zod · Sentry.

## Getting started

```bash
npm install
npx expo install --fix          # align native modules to the SDK
cp .env.example .env            # fill Supabase + Mapbox tokens
```

`@rnmapbox/maps` is a native module, so you need a **dev build** (not Expo Go):

```bash
npx expo run:ios      # or: npx expo run:android
```

## Scripts

| Command                                | What                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| `npm run typecheck`                    | `tsc --noEmit` (strict)                                |
| `npm run lint`                         | ESLint (eslint-config-expo)                            |
| `npm test`                             | Jest (jest-expo)                                       |
| `npm run gen:types`                    | regenerate `src/types/database.ts` from local Supabase |
| `bash scripts/db/verify-migrations.sh` | apply migrations to a throwaway PostGIS container      |

## Layout

- `app/` — Expo Router routes (thin screens)
- `src/features/*` — feature-first slices (`api/components/hooks/stores/types/utils`)
- `src/components/ui` — shared primitives · `src/theme` — tokens · `src/services` — outside-world boundary
- `supabase/migrations` — schema source of truth (PostGIS + RLS)
- `scripts/scoring` — offline difficulty scoring pipeline (pure core implemented + tested)
- `docs/phase-0-plan.md` — full architecture, DB, and scoring plan · `CLAUDE.md` — conventions

See [`CLAUDE.md`](CLAUDE.md) for architecture rules and the running decision log.
