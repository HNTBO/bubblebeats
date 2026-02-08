import { useRef, useCallback, useLayoutEffect, useState } from 'react';
import { formatTime, countWords, estimateDuration } from '../utils/timing';
import { useSettings } from '../hooks/useSettings';
import { X } from 'lucide-react';
import { PopOverlay } from './PopOverlay';

interface TextBubbleProps {
  content: string;
  durationSeconds: number;
  isFiller: boolean;
  isEditing: boolean;
  onContentChange: (content: string) => void;
  onEnterEdit: () => void;
  onExitEdit: () => void;
  onSplit: (charOffset: number) => void;
  onDurationChange: (seconds: number) => void;
  cumulativeTime: number;
  pairIndex: number;
  totalPairs: number;
  onDeletePair: () => void;
  onMergePairUp: () => void;
  onMergePairDown: () => void;
}

export function TextBubble({
  content,
  durationSeconds,
  isFiller,
  isEditing,
  onContentChange,
  onEnterEdit,
  onExitEdit,
  onSplit,
  onDurationChange,
  cumulativeTime,
  pairIndex,
  totalPairs,
  onDeletePair,
  onMergePairUp,
  onMergePairDown,
}: TextBubbleProps) {
  const { settings } = useSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [editHeight, setEditHeight] = useState(0);
  const [showPop, setShowPop] = useState(false);

  // Capture bubble height when entering edit mode (prevents shrink during editing)
  useLayoutEffect(() => {
    if (isEditing && bubbleRef.current) {
      setEditHeight(bubbleRef.current.offsetHeight);
    } else {
      setEditHeight(0);
    }
  }, [isEditing]);

  // Focus textarea when entering edit mode
  useLayoutEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Auto-resize textarea
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = el.scrollHeight + 'px';
  }, [content]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isFiller) {
        e.stopPropagation();
        onEnterEdit();
      }
    },
    [isFiller, onEnterEdit]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!e.ctrlKey || isFiller) return;
      e.preventDefault();
      e.stopPropagation();
      if (isEditing && textareaRef.current) {
        // Already editing — split at cursor
        const offset = textareaRef.current.selectionStart;
        if (offset > 0) {
          onSplit(offset);
        }
      } else {
        // Not editing — enter edit mode
        onEnterEdit();
      }
    },
    [isEditing, isFiller, onSplit, onEnterEdit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        e.preventDefault();
        onExitEdit();
        return;
      }
      // Shift+Enter → exit edit mode
      if (e.key === 'Enter' && e.shiftKey && isEditing) {
        e.preventDefault();
        onExitEdit();
        return;
      }
      // Ctrl+Enter → split at cursor
      if (e.key === 'Enter' && e.ctrlKey && isEditing && !isFiller && textareaRef.current) {
        e.preventDefault();
        const offset = textareaRef.current.selectionStart;
        if (offset > 0) {
          onSplit(offset);
        }
        return;
      }
    },
    [isEditing, isFiller, onExitEdit, onSplit]
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
        const newDuration = Math.max(1, startDuration + deltaSec);
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

  const handlePopClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isFiller) {
        onDeletePair();
      } else {
        setShowPop(true);
      }
    },
    [isFiller, onDeletePair]
  );

  if (isFiller) {
    return (
      <div
        className="relative group rounded-3xl border border-dashed flex flex-col items-center justify-center select-none h-full border-stroke-filler bg-surface-sunken"
      >
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          pause {durationSeconds.toFixed(1)}s
        </span>
        {settings.infoMode && (
          <span className="absolute top-2 left-3 text-[9px] font-mono text-text-info">
            {formatTime(cumulativeTime)}
          </span>
        )}
        {/* Pop icon — top right, on hover */}
        <button
          className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-text-primary"
          onClick={handlePopClick}
        >
          <X size={14} />
        </button>
        {/* Resize handle — fillers only */}
        <div
          className="absolute bottom-0 left-4 right-4 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onMouseDown={handleMouseDown}
        >
          <div className="mx-auto w-8 h-0.5 rounded mt-1 bg-stroke-filler" />
        </div>
      </div>
    );
  }

  const wordCount = countWords(content);
  const neededDuration = estimateDuration(content);
  const overBudget = neededDuration > durationSeconds && durationSeconds > 0;

  return (
    <div
      ref={bubbleRef}
      data-editing-bubble={isEditing || undefined}
      className={`relative group rounded-3xl border px-4 pb-4 ${settings.infoMode ? 'pt-7' : 'pt-4'} flex flex-col h-full transition-colors ${
        isEditing
          ? 'border-stroke-editing bg-surface-raised shadow-[var(--shadow-editing)]'
          : overBudget
            ? 'border-stroke-error bg-surface-error shadow-[var(--shadow-error)]'
            : 'border-stroke bg-surface-raised'
      }`}
      style={isEditing && editHeight > 0 ? { minHeight: editHeight } : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* TC-IN — top left */}
      {settings.infoMode && (
        <span className="absolute top-2 left-3 text-[9px] font-mono text-text-info">
          {formatTime(cumulativeTime)}
        </span>
      )}

      {/* Pop icon — top right, on hover, hidden during edit */}
      {!isEditing && (
        <button
          className="absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-text-secondary hover:text-text-primary"
          onClick={handlePopClick}
        >
          <X size={14} />
        </button>
      )}

      {/* Pop Overlay */}
      {showPop && (
        <PopOverlay
          mode="text"
          canMergeUp={pairIndex > 0}
          canMergeDown={pairIndex < totalPairs - 1}
          onMergeUp={() => { setShowPop(false); onMergePairUp(); }}
          onMergeDown={() => { setShowPop(false); onMergePairDown(); }}
          onErase={() => { setShowPop(false); onDeletePair(); }}
          onExit={() => setShowPop(false)}
        />
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={!isEditing}
        className={`w-full bg-transparent text-sm outline-none resize-none leading-relaxed overflow-hidden text-text-primary ${!isEditing ? 'cursor-default pointer-events-none' : ''}`}
        style={{ fontFamily: "'SN Pro', sans-serif", fontWeight: 300 }}
        placeholder="Type your voiceover text..."
        tabIndex={isEditing ? 0 : -1}
      />

      {settings.infoMode && (
        <div className="flex justify-between items-center mt-1 text-[10px] flex-shrink-0">
          <span className="text-text-muted">
            {wordCount} words
          </span>
          <span className={overBudget ? 'text-danger' : 'text-text-muted'}>
            ~{durationSeconds.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  );
}
