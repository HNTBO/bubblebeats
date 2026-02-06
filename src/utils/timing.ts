/** Average speaking rate for educational/tutorial content (words per minute) */
const WORDS_PER_MINUTE = 150;

/** Count words in a string */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Estimate speaking duration in seconds for a given text */
export function estimateDuration(text: string): number {
  const words = countWords(text);
  return (words / WORDS_PER_MINUTE) * 60;
}

/** Pixels per second for visual representation */
export const PX_PER_SECOND = 40;

/** Convert seconds to pixel height */
export function secondsToPx(seconds: number): number {
  return seconds * PX_PER_SECOND;
}

/** Convert pixel height to seconds */
export function pxToSeconds(px: number): number {
  return px / PX_PER_SECOND;
}

/** Minimum bubble height in pixels */
export const MIN_BUBBLE_PX = 40;

/** Minimum filler bubble height in pixels */
export const MIN_FILLER_PX = 16;

/**
 * Check if a text bubble's content fits in its allocated duration.
 * Returns a ratio: < 1 means too fast, > 1 means has room, 1 is perfect.
 */
export function timingRatio(text: string, allocatedSeconds: number): number {
  const needed = estimateDuration(text);
  if (needed === 0) return 1;
  return allocatedSeconds / needed;
}

/** Format seconds as M:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
