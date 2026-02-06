import { useCallback, useRef, useEffect, useState } from 'react';
import type { BubblePair } from '../types/script';
import { TextBubble } from './TextBubble';
import { VisualBubble } from './VisualBubble';
import { formatTime } from '../utils/timing';
import { useSettings } from '../hooks/useSettings';
import { Plus } from 'lucide-react';

interface BubbleTimelineProps {
  pairs: BubblePair[];
  totalDuration: number;
  onUpdateText: (pairId: string, content: string) => void;
  onCommitText: (pairId: string) => void;
  onUpdateVisual: (pairId: string, content: string) => void;
  onSplit: (pairId: string, charOffset: number) => void;
  onInsertFiller: (atIndex: number) => void;
  onUpdateDuration: (pairId: string, side: 'text' | 'visual', duration: number) => void;
  onDeletePair: (pairId: string) => void;
  onMergePairUp: (pairId: string) => void;
  onMergePairDown: (pairId: string) => void;
  onMergeVisualUp: (pairId: string) => void;
  onMergeVisualDown: (pairId: string) => void;
}

const GAP_PX = 8;

export function BubbleTimeline({
  pairs,
  totalDuration,
  onUpdateText,
  onCommitText,
  onUpdateVisual,
  onSplit,
  onInsertFiller,
  onUpdateDuration,
  onDeletePair,
  onMergePairUp,
  onMergePairDown,
  onMergeVisualUp,
  onMergeVisualDown,
}: BubbleTimelineProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === scrollEl) {
          setContainerHeight(entry.contentRect.height);
        } else if (entry.target === contentEl) {
          setNaturalHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(scrollEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, []);

  // Duration calculations
  const textDuration = pairs.reduce((sum, p) => sum + p.text.durationSeconds, 0);
  const remainingTime = Math.max(0, totalDuration - textDuration);
  const overBudget = textDuration > totalDuration;
  const effectiveTotal = Math.max(textDuration, totalDuration);

  // Min-heights: proportional for fillers, small fixed for text pairs
  const proportionalPxPerSec = containerHeight / effectiveTotal;
  const fillerPxPerSec = Math.max(proportionalPxPerSec, 30);
  const pairMinHeights = pairs.map((p) => {
    if (p.text.type === 'filler') {
      return Math.max(28, p.text.durationSeconds * fillerPxPerSec);
    }
    return 48;
  });

  const fillerMinHeight = remainingTime > 0
    ? Math.max(24, (remainingTime / effectiveTotal) * containerHeight)
    : 0;

  // Cumulative times
  const cumulativeTimes: number[] = [];
  let runningTime = 0;
  for (const pair of pairs) {
    cumulativeTimes.push(runningTime);
    runningTime += pair.text.durationSeconds;
  }

  // Zoom
  const fitScale = naturalHeight > containerHeight && containerHeight > 0
    ? containerHeight / naturalHeight
    : 1;

  const scale = fitScale < 1
    ? 1 + settings.zoom * (fitScale - 1)
    : 1;

  // Edit mode coordination
  const enterEditMode = useCallback(
    (pairId: string) => {
      if (editingPairId && editingPairId !== pairId) {
        onCommitText(editingPairId);
      }
      setEditingPairId(pairId);
    },
    [editingPairId, onCommitText]
  );

  const exitEditMode = useCallback(() => {
    if (editingPairId) {
      onCommitText(editingPairId);
    }
    setEditingPairId(null);
  }, [editingPairId, onCommitText]);

  // Click-outside handler to exit edit mode
  useEffect(() => {
    if (!editingPairId) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-editing-bubble]')) return;
      setEditingPairId((current) => {
        if (current) onCommitText(current);
        return null;
      });
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [editingPairId, onCommitText]);

  const scrollbarClass = `custom-scrollbar ${dark ? 'scrollbar-dark' : 'scrollbar-light'}`;

  // Build grid row templates:
  // For each pair i: separator row (GAP_PX height) + content row (auto)
  // Row numbering (1-indexed): separator = 2*i + 1, content = 2*i + 2
  const gridTemplateRows = pairs
    .flatMap((_, i) => {
      const sepHeight = `${GAP_PX}px`;
      const contentHeight = `minmax(${pairMinHeights[i]}px, auto)`;
      return i === 0 ? [sepHeight, contentHeight] : [sepHeight, contentHeight];
    })
    .join(' ');

  // Build grid items
  const gridItems: React.ReactNode[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const sepRow = 2 * i + 1;
    const contentRow = 2 * i + 2;

    // Separator + button (voice column only)
    gridItems.push(
      <div
        key={`sep-${pair.id}`}
        className="relative cursor-pointer group/boundary"
        style={{ gridColumn: 1, gridRow: sepRow }}
        onClick={() => onInsertFiller(i)}
      >
        <div className="absolute -top-2 -bottom-2 left-0 right-0 flex items-center justify-center z-10">
          <div className={`rounded-full p-0.5 opacity-0 group-hover/boundary:opacity-100 transition-opacity ${
            dark ? 'bg-slate-800 shadow-sm' : 'bg-white shadow-sm'
          }`}>
            <Plus size={12} className={dark ? 'text-slate-400' : 'text-slate-500'} />
          </div>
        </div>
      </div>
    );

    // Text bubble (voice column)
    gridItems.push(
      <div
        key={`text-${pair.id}`}
        style={{ gridColumn: 1, gridRow: contentRow }}
      >
        <TextBubble
          content={pair.text.content}
          durationSeconds={pair.text.durationSeconds}
          isFiller={pair.text.type === 'filler'}
          isEditing={pair.id === editingPairId}
          onContentChange={(c) => onUpdateText(pair.id, c)}
          onEnterEdit={() => enterEditMode(pair.id)}
          onExitEdit={exitEditMode}
          onSplit={(offset) => onSplit(pair.id, offset)}
          onDurationChange={(d) => onUpdateDuration(pair.id, 'text', d)}
          cumulativeTime={cumulativeTimes[i]}
          pairIndex={i}
          totalPairs={pairs.length}
          onDeletePair={() => onDeletePair(pair.id)}
          onMergePairUp={() => onMergePairUp(pair.id)}
          onMergePairDown={() => onMergePairDown(pair.id)}
        />
      </div>
    );

    // Visual bubble (visual column) — only render if visualSpan !== 0
    const span = pair.visualSpan ?? 1;
    if (span !== 0) {
      // Calculate end row: spans N content rows + (N-1) separator rows between them
      const endRow = contentRow + 2 * span - 1;

      gridItems.push(
        <div
          key={`visual-${pair.id}`}
          style={{
            gridColumn: 2,
            gridRow: `${contentRow} / ${endRow}`,
          }}
        >
          <VisualBubble
            content={pair.visual.content}
            onContentChange={(c) => onUpdateVisual(pair.id, c)}
            showPlaceholder={i === 0}
            pairIndex={i}
            totalPairs={pairs.length}
            onMergeVisualUp={() => onMergeVisualUp(pair.id)}
            onMergeVisualDown={() => onMergeVisualDown(pair.id)}
          />
        </div>
      );
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden flex-col">
      <div ref={scrollRef} className={`flex-1 overflow-y-auto flex flex-col ${scrollbarClass}`} style={{ scrollbarGutter: 'stable' }}>
        <div
          style={{
            height: scale < 1 ? naturalHeight * scale : undefined,
            overflow: scale < 1 ? 'hidden' : undefined,
            width: '100%',
            margin: scale < 1 && naturalHeight * scale < containerHeight ? 'auto 0' : undefined,
          }}
        >
          <div
            ref={contentRef}
            style={{
              transform: scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: 'top center',
            }}
          >
            {/* Column headers */}
            <div className="grid grid-cols-2 px-4 py-2" style={{ gap: GAP_PX }}>
              <div className={`text-center ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Voice
                </span>
              </div>
              <div className={`text-center ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Visual
                </span>
              </div>
            </div>

            {/* Single CSS Grid for all pairs */}
            <div
              className="px-4 pb-4"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: GAP_PX,
                gridTemplateRows,
              }}
            >
              {gridItems}
            </div>

            {/* Filler: remaining time */}
            {fillerMinHeight > 0 && (
              <div className="px-4">
                <div style={{ height: GAP_PX }} />
                <div
                  className="grid grid-cols-2 items-stretch"
                  style={{ gap: GAP_PX, minHeight: fillerMinHeight }}
                >
                  <div className={`rounded-3xl border border-dashed flex items-center justify-center select-none ${
                    dark
                      ? 'border-slate-700 bg-slate-900/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}>
                    <span className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                      {formatTime(remainingTime)} remaining
                    </span>
                  </div>
                  <div className={`rounded-3xl border border-dashed ${
                    dark
                      ? 'border-slate-700 bg-slate-900/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`} />
                </div>
              </div>
            )}

            {/* Over budget */}
            {overBudget && (
              <div className="px-4 pt-2">
                <div className={`rounded-3xl border border-dashed flex items-center justify-center py-2 ${
                  dark
                    ? 'border-red-500/40 bg-red-950/20'
                    : 'border-red-300 bg-red-50'
                }`}>
                  <span className="text-[10px] uppercase tracking-wider text-red-400">
                    over by {formatTime(textDuration - totalDuration)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
