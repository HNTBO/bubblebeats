import { useSettings } from '../hooks/useSettings';

interface VisualBubbleProps {
  content: string;
  onContentChange: (content: string) => void;
  height: number;
}

export function VisualBubble({
  content,
  onContentChange,
  height,
}: VisualBubbleProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';

  return (
    <div className="h-full" style={{ minHeight: height }}>
      <div className={`h-full rounded-3xl border p-4 ${
        dark
          ? 'border-emerald-800/40 bg-emerald-950/20'
          : 'border-emerald-200 bg-emerald-50/50'
      }`}>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className={`w-full h-full bg-transparent text-sm outline-none resize-none leading-relaxed italic overflow-auto ${
            dark ? 'text-emerald-300/80' : 'text-emerald-700/80'
          }`}
          placeholder="Describe the visual..."
        />
      </div>
    </div>
  );
}
