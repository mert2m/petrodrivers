# music (v2 SEAM — do not implement in v1)

Spotify integration / auto-start music. **Explicit v1 non-goal (spec §1). Do NOT scaffold the SDK now.**

Interface types only (`types/music.ts`). A future `services/music` implements `MusicProvider` behind the
same OAuth (Edge Function) + entitlement seams the co-driver uses.
