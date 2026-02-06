import { useRef, useCallback, useLayoutEffect } from 'react';
import { formatTime, countWords, estimateDuration } from '../utils/timing';
import { useSettings } from '../hooks/useSettings';

interface TextBubbleProps {
  content: string;
  durationSeconds: number;
  isFiller: boolean;
  onContentChange: (content: string) => void;
  onSplit: (charOffset: number) => void;
  onDurationChange: (seconds: number) => void;
  cumulativeTime: number;
}

export function TextBubble({
  content,
  durationSeconds,
  isFiller,
  onContentChange,
  onSplit,
  onDurationChange,
  cumulativeTime,
}: TextBubbleProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = el.scrollHeight + 'px';
  }, [content]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey && !isFiller && textareaRef.current) {
        e.preventDefault();
        const offset = textareaRef.current.selectionStart;
        if (offset > 0 && offset < content.length) {
          onSplit(offset);
        }
      }
    },
    [content, isFiller, onSplit]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startY = e.clientY;
      const startDuration = durationSeconds;

      const onMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientY - startY;
        const deltaSec = delta / 40;
        const newDuration = Math.max(0.5, startDuration + deltaSec);
        onDurationChange(newDuration);
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [durationSeconds, onDurationChange]
  );

  if (isFiller) {
    return (
      <div
        className={`relative group rounded-3xl border border-dashed flex flex-col items-center justify-center select-none ${
          dark
            ? 'border-slate-600 bg-slate-800/30'
            : 'border-slate-300 bg-slate-50'
        }`}
      >
        <span className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          pause {durationSeconds.toFixed(1)}s
        </span>
        {settings.infoMode && (
          <span className={`absolute top-2 right-3 text-[9px] font-mono ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            {formatTime(cumulativeTime)}
          </span>
        )}
        {/* Resize handle */}
        <div
          className="absolute bottom-0 left-4 right-4 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onMouseDown={handleMouseDown}
        >
          <div className={`mx-auto w-8 h-0.5 rounded mt-1 ${dark ? 'bg-slate-500' : 'bg-slate-300'}`} />
        </div>
      </div>
    );
  }

  const wordCount = countWords(content);
  const neededDuration = estimateDuration(content);
  const overBudget = neededDuration > durationSeconds && durationSeconds > 0;

  return (
    <div
      className={`relative group rounded-3xl border p-4 flex flex-col transition-colors ${
        overBudget
          ? dark
            ? 'border-red-500/60 bg-red-950/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
            : 'border-red-300 bg-red-50 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
          : dark
            ? 'border-slate-600 bg-slate-800/50'
            : 'border-slate-200 bg-white'
      }`}
      onClick={handleClick}
    >
      {settings.infoMode && (
        <span className={`absolute top-2 right-3 text-[9px] font-mono ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
          {formatTime(cumulativeTime)}
        </span>
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className={`w-full bg-transparent text-sm outline-none resize-none leading-relaxed overflow-hidden ${
          dark ? 'text-slate-200' : 'text-slate-700'
        }`}
        placeholder="Type your voiceover text..."
      />

      {settings.infoMode && (
        <div className="flex justify-between items-center mt-1 text-[10px] flex-shrink-0">
          <span className={dark ? 'text-slate-500' : 'text-slate-400'}>
            {wordCount} words
          </span>
          <span className={overBudget ? 'text-red-400' : dark ? 'text-slate-500' : 'text-slate-400'}>
            ~{durationSeconds.toFixed(1)}s
          </span>
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-4 right-4 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onMouseDown={handleMouseDown}
      >
        <div className={`mx-auto w-8 h-0.5 rounded mt-1 ${dark ? 'bg-slate-500' : 'bg-slate-300'}`} />
      </div>
    </div>
  );
}
