export interface Bubble {
  id: string;
  type: 'text' | 'filler';
  content: string;
  /** Duration in seconds - calculated from text length or manually set */
  durationSeconds: number;
  /** Whether the user manually overrode the calculated duration */
  manualDuration?: boolean;
}

export interface BubblePair {
  id: string;
  text: Bubble;
  visual: Bubble;
  /** Visual column spanning:
   *  undefined or 1 = normal single pair
   *  0 = hidden (covered by a span from above)
   *  N > 1 = this visual spans N consecutive pairs */
  visualSpan?: number;
}

export interface Script {
  title: string;
  totalDurationSeconds: number;
  pairs: BubblePair[];
}

export interface FileEntry {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
}
