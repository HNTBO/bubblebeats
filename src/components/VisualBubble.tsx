import { useRef, useLayoutEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { X } from 'lucide-react';
import { PopOverlay } from './PopOverlay';

interface VisualBubbleProps {
  content: string;
  onContentChange: (content: string) => void;
  showPlaceholder?: boolean;
  pairIndex: number;
  totalPairs: number;
  onMergeVisualUp: () => void;
  onMergeVisualDown: () => void;
}

export function VisualBubble({
  content,
  onContentChange,
  showPlaceholder = false,
  pairIndex,
  totalPairs,
  onMergeVisualUp,
  onMergeVisualDown,
}: VisualBubbleProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPop, setShowPop] = useState(false);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = el.scrollHeight + 'px';
  }, [content]);

  return (
    <div className={`relative group rounded-3xl border p-4 h-full ${
      dark
        ? 'border-emerald-800/40 bg-emerald-950/20'
        : 'border-emerald-200 bg-emerald-50/50'
    }`}>
      {/* Pop icon — top right, on hover */}
      <button
        className={`absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${dark ? 'text-emerald-600 hover:text-emerald-300' : 'text-emerald-400 hover:text-emerald-600'}`}
        onClick={(e) => { e.stopPropagation(); setShowPop(true); }}
      >
        <X size={14} />
      </button>

      {/* Pop Overlay */}
      {showPop && (
        <PopOverlay
          mode="visual"
          canMergeUp={pairIndex > 0}
          canMergeDown={pairIndex < totalPairs - 1}
          onMergeUp={() => { setShowPop(false); onMergeVisualUp(); }}
          onMergeDown={() => { setShowPop(false); onMergeVisualDown(); }}
          onExit={() => setShowPop(false)}
        />
      )}

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
