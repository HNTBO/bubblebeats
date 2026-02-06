import { useRef, useCallback } from 'react';
import { timingRatio, formatTime, secondsToPx, MIN_BUBBLE_PX } from '../utils/timing';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const ratio = isFiller ? 1 : timingRatio(content, durationSeconds);
  const isTooFast = ratio < 0.85;
  const isComfortable = ratio >= 0.85;

  const height = Math.max(secondsToPx(durationSeconds), MIN_BUBBLE_PX);

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
        const deltaSec = delta / 40; // PX_PER_SECOND
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
      <div className="relative group" style={{ height }}>
        <div
          className="mx-2 h-full rounded border border-dashed border-slate-600 bg-slate-800/30 flex items-center justify-center cursor-ns-resize select-none"
          onMouseDown={handleMouseDown}
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            pause {durationSeconds.toFixed(1)}s
          </span>
        </div>
        <span className="absolute -left-8 top-0 text-[10px] text-slate-600 font-mono">
          {formatTime(cumulativeTime)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative group" style={{ minHeight: height }}>
      <div
        className={`mx-2 rounded-lg border p-3 transition-colors ${
          isTooFast
            ? 'border-red-500/60 bg-red-950/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
            : isComfortable
              ? 'border-slate-600 bg-slate-800/50'
              : 'border-slate-600 bg-slate-800/50'
        }`}
        onClick={handleClick}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-200 outline-none resize-none leading-relaxed"
          rows={Math.max(2, content.split('\n').length)}
          placeholder="Type your voiceover text..."
        />
        <div className="flex justify-between items-center mt-1 text-[10px]">
          <span className="text-slate-500">
            {content.trim().split(/\s+/).filter(Boolean).length} words
          </span>
          <span className={isTooFast ? 'text-red-400' : 'text-slate-500'}>
            ~{durationSeconds.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleMouseDown}
      >
        <div className="mx-auto w-8 h-0.5 bg-slate-500 rounded mt-0.5" />
      </div>

      {/* Time label */}
      <span className="absolute -left-8 top-0 text-[10px] text-slate-600 font-mono">
        {formatTime(cumulativeTime)}
      </span>
    </div>
  );
}
