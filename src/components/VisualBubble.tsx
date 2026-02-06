import { useRef, useLayoutEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

interface VisualBubbleProps {
  content: string;
  onContentChange: (content: string) => void;
  showPlaceholder?: boolean;
}

export function VisualBubble({
  content,
  onContentChange,
  showPlaceholder = false,
}: VisualBubbleProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = el.scrollHeight + 'px';
  }, [content]);

  return (
    <div className={`rounded-3xl border p-4 ${
      dark
        ? 'border-emerald-800/40 bg-emerald-950/20'
        : 'border-emerald-200 bg-emerald-50/50'
    }`}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className={`w-full bg-transparent text-sm outline-none resize-none leading-relaxed overflow-hidden italic ${
          dark ? 'text-emerald-300/80' : 'text-emerald-700/80'
        }`}
        placeholder={showPlaceholder ? 'Describe the visual...' : undefined}
      />
    </div>
  );
}
