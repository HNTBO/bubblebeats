import { useRef, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

interface VisualBubbleProps {
  content: string;
  textBubbleRef: React.RefObject<HTMLDivElement | null>;
  onContentChange: (content: string) => void;
}

export function VisualBubble({
  content,
  textBubbleRef,
  onContentChange,
}: VisualBubbleProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Match height to text bubble
  useEffect(() => {
    if (!textBubbleRef.current || !containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (textBubbleRef.current && containerRef.current) {
        const textHeight = textBubbleRef.current.offsetHeight;
        containerRef.current.style.minHeight = textHeight + 'px';
      }
    });

    observer.observe(textBubbleRef.current);
    return () => observer.disconnect();
  }, [textBubbleRef]);

  return (
    <div ref={containerRef}>
      <div className={`h-full rounded-3xl border p-4 ${
        dark
          ? 'border-emerald-800/40 bg-emerald-950/20'
          : 'border-emerald-200 bg-emerald-50/50'
      }`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className={`w-full bg-transparent text-sm outline-none resize-none leading-relaxed italic overflow-hidden ${
            dark ? 'text-emerald-300/80' : 'text-emerald-700/80'
          }`}
          rows={1}
          placeholder="Describe the visual..."
        />
      </div>
    </div>
  );
}
