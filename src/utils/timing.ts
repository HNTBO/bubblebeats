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

/** Format seconds as M:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Minimum bubble height in pixels (so empty/tiny bubbles are still visible) */
export const MIN_BUBBLE_PX = 48;
