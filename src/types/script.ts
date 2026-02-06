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
}

export interface Script {
  title: string;
  totalDurationSeconds: number;
  pairs: BubblePair[];
}
