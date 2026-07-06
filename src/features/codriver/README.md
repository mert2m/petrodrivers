# codriver (v2 SEAM — do not implement in v1)

AI co-driver: voice guidance, look-ahead corner calls, TTS, voice packs. **Explicit v1 non-goal (spec §1).**

This folder holds **interface types only** (`types/codriver.ts`). No `services/codriver/` exists in v1.

Why it slots in without a refactor:

- The v1 map feature already tracks a **selected segment** in its Zustand UI store. A future
  `services/codriver` implementing `CoDriverProvider` subscribes to that existing selection to satisfy
  `onSegmentApproach` — the map feature does not change.
- The **Edge Function seam** (v1 weather proxy) is where TTS token-signing drops in as a sibling.
- The **entitlement seam** (`useEntitlements`) is where co-driver gets gated behind premium.

Hard constraints for whenever this is built: hands-free + eyes-up by design; **no speed/pace/racing** cues.
