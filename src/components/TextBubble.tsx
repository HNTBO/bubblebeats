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
  const dark = settings.theme === 'dark';
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
      if (e.ctrlKey && isEditing && !isFiller && textareaRef.current) {
        e.preventDefault();
        const offset = textareaRef.current.selectionStart;
        if (offset > 0) {
          onSplit(offset);
        }
      }
    },
    [isEditing, isFiller, onSplit]
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
        className={`relative group rounded-3xl border border-dashed flex flex-col items-center justify-center select-none h-full ${
          dark
            ? 'border-slate-600 bg-slate-800/30'
            : 'border-slate-300 bg-slate-50'
        }`}
      >
        <span className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          pause {durationSeconds.toFixed(1)}s
        </span>
        {settings.infoMode && (
          <span className={`absolute top-2 left-3 text-[9px] font-mono ${dark ? 'text-rose-400/40' : 'text-slate-400'}`}>
            {formatTime(cumulativeTime)}
          </span>
        )}
        {/* Pop icon — top right, on hover */}
        <button
          className={`absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={handlePopClick}
        >
          <X size={14} />
        </button>
        {/* Resize handle — fillers only */}
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
      ref={bubbleRef}
      data-editing-bubble={isEditing || undefined}
      className={`relative group rounded-3xl border px-4 pb-4 ${settings.infoMode ? 'pt-7' : 'pt-4'} flex flex-col h-full transition-colors ${
        isEditing
          ? dark
            ? 'border-violet-500/60 bg-slate-800/50 shadow-[inset_0_0_12px_rgba(139,92,246,0.15)]'
            : 'border-violet-400 bg-white shadow-[inset_0_0_12px_rgba(139,92,246,0.12)]'
          : overBudget
            ? dark
              ? 'border-red-500/60 bg-red-950/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
              : 'border-red-300 bg-red-50 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
            : dark
              ? 'border-slate-600/60 bg-slate-800/50'
              : 'border-slate-200 bg-white'
      }`}
      style={isEditing && editHeight > 0 ? { minHeight: editHeight } : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* TC-IN — top left */}
      {settings.infoMode && (
        <span className={`absolute top-2 left-3 text-[9px] font-mono ${dark ? 'text-rose-400/40' : 'text-slate-400'}`}>
          {formatTime(cumulativeTime)}
        </span>
      )}

      {/* Pop icon — top right, on hover, hidden during edit */}
      {!isEditing && (
        <button
          className={`absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
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
        className={`w-full bg-transparent text-sm outline-none resize-none leading-relaxed overflow-hidden ${
          dark ? 'text-slate-200' : 'text-slate-700'
        } ${!isEditing ? 'cursor-default pointer-events-none' : ''}`}
        style={{ fontFamily: "'SN Pro', sans-serif", fontWeight: 300 }}
        placeholder="Type your voiceover text..."
        tabIndex={isEditing ? 0 : -1}
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
    </div>
  );
}
