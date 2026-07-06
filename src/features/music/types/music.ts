// features/music/types/music.ts — v2 SEAM. Interface ONLY. NO implementation in v1.
// Spotify integration / auto-start music is an explicit v1 non-goal (spec §1). Do NOT scaffold the SDK.

export interface AuthResult {
  connected: boolean;
  expiresAt?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
}

export interface MusicProvider {
  connect(): Promise<AuthResult>;
  nowPlaying(): Promise<Track | null>;
  play(uri: string): Promise<void>;
}
