import type { Script } from '../types/script';
import { formatTime } from './timing';

/**
 * Export a Script object to markdown format matching the import format.
 *
 * Output:
 * ```
 * # Script Title
 *
 * ## Voiceover Script
 *
 * [0:00] *Visual description*
 *
 * Voiceover text here...
 *
 * [0:08] *Another visual*
 *
 * More text...
 * ```
 */
export function exportToMarkdown(script: Script): string {
  const lines: string[] = [];

  lines.push(`# ${script.title}`);
  lines.push('');
  lines.push('## Voiceover Script');
  lines.push('');

  let cumulativeTime = 0;

  for (const pair of script.pairs) {
    const tc = formatTime(cumulativeTime);

    if (pair.text.type === 'filler') {
      // Fillers are represented as empty timecoded sections
      lines.push(`[${tc}]`);
      lines.push('');
    } else {
      lines.push(`[${tc}]${pair.visual.content ? ` *${pair.visual.content.replace(/\n/g, ' ')}*` : ''}`);
      lines.push('');
      if (pair.text.content) {
        lines.push(pair.text.content);
        lines.push('');
      }
    }

    cumulativeTime += pair.text.durationSeconds;
  }

  return lines.join('\n');
}

export function exportToJson(script: Script): string {
  return JSON.stringify(script, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
