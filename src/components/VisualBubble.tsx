import { secondsToPx, MIN_BUBBLE_PX } from '../utils/timing';

interface VisualBubbleProps {
  content: string;
  durationSeconds: number;
  isFiller: boolean;
  onContentChange: (content: string) => void;
}

export function VisualBubble({
  content,
  durationSeconds,
  isFiller,
  onContentChange,
}: VisualBubbleProps) {
  const height = Math.max(secondsToPx(durationSeconds), MIN_BUBBLE_PX);

  if (isFiller) {
    return (
      <div style={{ height }}>
        <div className="mx-2 h-full rounded border border-dashed border-slate-600 bg-slate-800/30" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: height }}>
      <div className="mx-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full bg-transparent text-sm text-emerald-300/80 outline-none resize-none leading-relaxed italic"
          rows={Math.max(2, content.split('\n').length)}
          placeholder="Describe the visual..."
        />
      </div>
    </div>
  );
}
