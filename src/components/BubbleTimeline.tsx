import { useCallback, useRef, useEffect, useState, Fragment } from 'react';
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
  onUpdateVisual: (pairId: string, content: string) => void;
  onSplit: (pairId: string, charOffset: number) => void;
  onInsertFiller: (atIndex: number) => void;
  onUpdateDuration: (pairId: string, side: 'text' | 'visual', duration: number) => void;
  onDeletePair: (pairId: string) => void;
}

// Uniform gap used between rows AND between columns
const GAP_PX = 8;

export function BubbleTimeline({
  pairs,
  totalDuration,
  onUpdateText,
  onUpdateVisual,
  onSplit,
  onInsertFiller,
  onUpdateDuration,
}: BubbleTimelineProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Measure scroll container height + natural content height via ResizeObserver
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

  // Proportional min-heights for each pair row
  const pairMinHeights = pairs.map((p) => {
    const fraction = p.text.durationSeconds / effectiveTotal;
    return Math.max(48, fraction * containerHeight);
  });

  const fillerMinHeight = remainingTime > 0
    ? Math.max(24, (remainingTime / effectiveTotal) * containerHeight)
    : 0;

  // Cumulative times for TC display
  const cumulativeTimes: number[] = [];
  let runningTime = 0;
  for (const pair of pairs) {
    cumulativeTimes.push(runningTime);
    runningTime += pair.text.durationSeconds;
  }

  // Zoom: uniform scaling from center
  // slider 0 = scale 1 (fill width), slider 1 = fit everything in viewport
  const fitScale = naturalHeight > containerHeight && containerHeight > 0
    ? containerHeight / naturalHeight
    : 1;

  const scale = fitScale < 1
    ? 1 + settings.zoom * (fitScale - 1)
    : 1;

  const handleBoundaryClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (e.ctrlKey) {
        e.preventDefault();
        onInsertFiller(index);
      }
    },
    [onInsertFiller]
  );

  const scrollbarClass = `custom-scrollbar ${dark ? 'scrollbar-dark' : 'scrollbar-light'}`;

  return (
    <div className="flex flex-1 overflow-hidden flex-col">
      {/* Scrollable + zoomable area */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto flex flex-col ${scrollbarClass}`}>
        {/* Centering wrapper: when scaled content < viewport, center it */}
        <div
          style={{
            height: scale < 1 ? naturalHeight * scale : undefined,
            overflow: scale < 1 ? 'hidden' : undefined,
            width: '100%',
            margin: scale < 1 && naturalHeight * scale < containerHeight ? 'auto 0' : undefined,
          }}
        >
          {/* Scaled content */}
          <div
            ref={contentRef}
            style={{
              transform: scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: 'top center',
            }}
          >
            {/* Column headers */}
            <div className="flex px-4 py-2" style={{ gap: GAP_PX }}>
              <div className={`flex-1 text-center ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Voice
                </span>
              </div>
              <div className={`flex-1 text-center ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Visual
                </span>
              </div>
            </div>

            {/* Pairs with separators */}
            <div className="flex flex-col px-4 pb-4">
              {pairs.map((pair, i) => (
                <Fragment key={pair.id}>
                  {/* Separator with centered + icon */}
                  {i > 0 && (
                    <div
                      className="relative flex items-center justify-center cursor-pointer group/boundary"
                      style={{ height: GAP_PX }}
                      onClick={(e) => handleBoundaryClick(e, i)}
                    >
                      <div className="absolute -top-2 -bottom-2 left-0 right-0 flex items-center justify-center z-10">
                        <div className={`rounded-full p-0.5 opacity-0 group-hover/boundary:opacity-100 transition-opacity ${
                          dark ? 'bg-slate-800 shadow-sm' : 'bg-white shadow-sm'
                        }`}>
                          <Plus size={12} className={dark ? 'text-slate-400' : 'text-slate-500'} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pair row: flex syncs height between voice and visual */}
                  <div className="flex" style={{ gap: GAP_PX, minHeight: pairMinHeights[i] }}>
                    <div className="flex-1">
                      <TextBubble
                        content={pair.text.content}
                        durationSeconds={pair.text.durationSeconds}
                        isFiller={pair.text.type === 'filler'}
                        onContentChange={(c) => onUpdateText(pair.id, c)}
                        onSplit={(offset) => onSplit(pair.id, offset)}
                        onDurationChange={(d) => onUpdateDuration(pair.id, 'text', d)}
                        cumulativeTime={cumulativeTimes[i]}
                      />
                    </div>
                    <div className="flex-1">
                      <VisualBubble
                        content={pair.visual.content}
                        onContentChange={(c) => onUpdateVisual(pair.id, c)}
                      />
                    </div>
                  </div>
                </Fragment>
              ))}

              {/* Gap before filler */}
              {fillerMinHeight > 0 && (
                <>
                  <div style={{ height: GAP_PX }} />
                  <div className="flex" style={{ gap: GAP_PX, minHeight: fillerMinHeight }}>
                    <div className="flex-1">
                      <div className={`min-h-full rounded-3xl border border-dashed flex items-center justify-center select-none ${
                        dark
                          ? 'border-slate-700 bg-slate-900/40'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}>
                        <span className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                          {formatTime(remainingTime)} remaining
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`min-h-full rounded-3xl border border-dashed ${
                        dark
                          ? 'border-slate-700 bg-slate-900/40'
                          : 'border-slate-200 bg-slate-50/60'
                      }`} />
                    </div>
                  </div>
                </>
              )}

              {/* Over budget warning */}
              {overBudget && (
                <div className="pt-2">
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
    </div>
  );
}
