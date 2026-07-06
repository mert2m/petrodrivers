# seed/

Curated-road seed data + loader (Phase 1). The ~50 hand-curated iconic roads and a loader that runs
the offline scoring pipeline (`scripts/scoring`) to populate `roads` + `road_segments`.

Loading is done via the `service_role` key (bypasses RLS) — never from the client. Start with 3–5 real
roads end-to-end to prove the pipeline, then the full ~50 (spec §9, Phase 1).
