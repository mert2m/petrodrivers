// features/codriver/types/codriver.ts — v2 SEAM. Interface ONLY. NO implementation in v1.
// A future services/codriver implementing CoDriverProvider subscribes to the map feature's existing
// selected-segment UI state to satisfy onSegmentApproach — no refactor of the map feature required.
// v2 co-driver MUST be hands-free + eyes-up by design (spec §11). No speed/pace anything, ever.

export interface SpeakOptions {
  interruptible?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface SegmentContext {
  roadId: string;
  segmentId: string;
  difficulty: 'easy' | 'medium' | 'technical' | 'hairpin';
}

export type Unsubscribe = () => void;

export interface CoDriverProvider {
  speak(text: string, opts?: SpeakOptions): Promise<void>; // TTS (v2)
  onSegmentApproach(cb: (seg: SegmentContext) => void): Unsubscribe;
  stop(): void;
}
