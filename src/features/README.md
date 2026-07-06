# features/

Feature-first architecture (spec §5). Each feature owns its slice and nothing reaches across features
except through `src/components/ui`, `src/lib`, and `src/services`.

Every feature folder follows the same shape:

```
<feature>/
├── api/          # typed query/mutation fns — the ONLY place that calls services/supabase
├── components/   # feature-specific UI (composes src/components/ui primitives)
├── hooks/        # React Query hooks + feature hooks (wrap api/)
├── stores/       # Zustand — EPHEMERAL UI state only, never server cache
├── types/        # feature types (+ Zod schemas at boundaries)
└── utils/        # pure helpers
```

Data flow: `services/supabase` (typed client) → feature `api/` → React Query `hooks/` → `components/`.
Screens in `app/` stay thin and compose feature components + hooks. No business logic in screens.

Feature build order (spec §9): Phase 2 → `map`, `roads`, `favorites`; Phase 3 → `auth`, `community`;
Phase 4 → `garage`, `dashboard`. `codriver` and `music` are v2 seams (interfaces only).
