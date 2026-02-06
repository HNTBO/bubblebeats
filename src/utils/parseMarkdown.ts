import type { Script, BubblePair } from '../types/script';
import { generateId } from './ids';
import { estimateDuration } from './timing';

/**
 * Parse a script markdown file into a Script object.
 *
 * Rules:
 * - Only timecodes [M:SS] create bubble breaks
 * - Line breaks within a section are preserved inside the bubble
 * - Timecodes themselves are NOT included in bubble text
 * - Stage directions *...* go to the visual column
 * - First content without an explicit timecode starts at 0:00
 */
export function parseScriptMarkdown(markdown: string): Script {
  // Extract title from first top-level heading
  const titleMatch = markdown.match(/^# (.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Imported Script';

  // Find the voiceover script section
  const scriptSectionMatch = markdown.match(/##\s+Voiceover Script[^\n]*/);
  const startIdx = scriptSectionMatch
    ? markdown.indexOf(scriptSectionMatch[0]) + scriptSectionMatch[0].length
    : 0;

  // Bound to next ## heading
  const restOfDoc = markdown.slice(startIdx);
  const nextSectionMatch = restOfDoc.match(/\n##\s+/);
  const scriptContent = nextSectionMatch
    ? restOfDoc.slice(0, nextSectionMatch.index)
    : restOfDoc;

  // Split on timecodes [M:SS] — timecodes are delimiters, not content
  const parts = scriptContent.split(/\[\d+:\d{2}\]/);

  // Each part is the content between timecodes (or before the first one)
  const sections = parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (sections.length === 0) {
    return {
      title,
      totalDurationSeconds: 120,
      pairs: [createEmptyPair()],
    };
  }

  // Parse each section into a bubble pair
  const pairs: BubblePair[] = sections.map((sectionContent) => {
    // Extract stage directions *...*
    const visuals: string[] = [];
    const textContent = sectionContent
      .replace(/\*([^*]+)\*/g, (_, dir: string) => {
        visuals.push(dir.trim());
        return '';
      })
      .replace(/^\n+|\n+$/g, '')   // trim leading/trailing newlines
      .replace(/\n{3,}/g, '\n\n'); // collapse excessive blank lines

    const text = textContent.trim();
    const visual = visuals.join('\n');

    return {
      id: generateId(),
      text: {
        id: generateId(),
        type: 'text' as const,
        content: text,
        durationSeconds: Math.max(estimateDuration(text), 0.5),
      },
      visual: {
        id: generateId(),
        type: 'text' as const,
        content: visual,
        durationSeconds: 0,
      },
    };
  }).filter((p) => p.text.content || p.visual.content);

  const totalDuration = pairs.reduce((sum, p) => sum + p.text.durationSeconds, 0);

  return {
    title,
    totalDurationSeconds: Math.max(120, Math.ceil(totalDuration / 10) * 10),
    pairs: pairs.length > 0 ? pairs : [createEmptyPair()],
  };
}

function createEmptyPair(): BubblePair {
  return {
    id: generateId(),
    text: {
      id: generateId(),
      type: 'text',
      content: '',
      durationSeconds: 0.5,
    },
    visual: {
      id: generateId(),
      type: 'text',
      content: '',
      durationSeconds: 0,
    },
  };
}
