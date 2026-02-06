import type { Script, BubblePair, Bubble } from '../types/script';
import { generateId } from './ids';
import { estimateDuration } from './timing';

/**
 * Parse a script markdown file into a Script object.
 *
 * Expected format:
 * ```
 * ## Voiceover Script (~270 words)
 *
 * [0:00] *Stage direction for visual*
 *
 * Voiceover text here...
 *
 * [0:08] *Another stage direction*
 *
 * More voiceover text...
 * ```
 */
export function parseScriptMarkdown(markdown: string): Script {
  // Extract title from first heading if present
  const titleMatch = markdown.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Imported Script';

  // Find the voiceover script section
  const scriptSectionMatch = markdown.match(/##\s+Voiceover Script[^\n]*/);
  const startIdx = scriptSectionMatch
    ? markdown.indexOf(scriptSectionMatch[0]) + scriptSectionMatch[0].length
    : 0;

  // Look for the next ## heading to bound the section
  const restOfDoc = markdown.slice(startIdx);
  const nextSectionMatch = restOfDoc.match(/\n##\s+/);
  const scriptContent = nextSectionMatch
    ? restOfDoc.slice(0, nextSectionMatch.index)
    : restOfDoc;

  // Split on timing cues [M:SS]
  const segments = scriptContent.split(/\[(\d+:\d{2})\]/);

  const pairs: BubblePair[] = [];

  // segments[0] is text before first timing cue (usually empty)
  // then alternating: timecode, content, timecode, content...
  for (let i = 1; i < segments.length; i += 2) {
    const content = segments[i + 1] || '';

    // Extract stage direction *...*
    const visualMatch = content.match(/\*([^*]+)\*/);
    const visual = visualMatch ? visualMatch[1].trim() : '';

    // Extract plain text (everything that's not the stage direction)
    const text = content
      .replace(/\*[^*]+\*/g, '') // remove stage directions
      .replace(/\n{2,}/g, '\n') // collapse multiple newlines
      .trim();

    if (!text && !visual) continue;

    const textBubble: Bubble = {
      id: generateId(),
      type: 'text',
      content: text,
      durationSeconds: Math.max(estimateDuration(text), 0.5),
    };

    const visualBubble: Bubble = {
      id: generateId(),
      type: 'text',
      content: visual,
      durationSeconds: 0,
    };

    pairs.push({
      id: generateId(),
      text: textBubble,
      visual: visualBubble,
    });
  }

  // If no segments were found, try a simpler parse (plain paragraphs)
  if (pairs.length === 0) {
    const paragraphs = scriptContent.split(/\n{2,}/).filter((p) => p.trim());
    for (const para of paragraphs) {
      const text = para.trim();
      if (!text) continue;

      pairs.push({
        id: generateId(),
        text: {
          id: generateId(),
          type: 'text',
          content: text,
          durationSeconds: Math.max(estimateDuration(text), 0.5),
        },
        visual: {
          id: generateId(),
          type: 'text',
          content: '',
          durationSeconds: 0,
        },
      });
    }
  }

  // Calculate total duration from parsed timecodes or text
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
