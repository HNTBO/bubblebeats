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
  onUpdateVisual: (pairId: string, content: string) => void;
  onSplit: (pairId: string, charOffset: number) => void;
  onInsertFiller: (atIndex: number) => void;
  onUpdateDuration: (pairId: string, side: 'text' | 'visual', duration: number) => void;
  onDeletePair: (pairId: string) => void;
}

const GAP_PX = 6; // aesthetic padding between bubbles (not counted toward time)

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Measure available height
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate durations and proportional heights
  const textDuration = pairs.reduce((sum, p) => sum + p.text.durationSeconds, 0);
  const remainingTime = Math.max(0, totalDuration - textDuration);
  const overBudget = textDuration > totalDuration;

  const effectiveTotal = Math.max(textDuration, totalDuration);

  // Total gap space needed (gaps between bubbles + filler)
  const bubbleCount = pairs.length + (remainingTime > 0 ? 1 : 0);
  const totalGapSpace = Math.max(0, bubbleCount - 1) * GAP_PX;

  // Available height for actual bubbles (without gaps)
  const availableHeight = containerHeight - totalGapSpace;

  // Natural heights at zoom=0 (proportional to container)
  const naturalPairHeights = pairs.map((p) => {
    const fraction = p.text.durationSeconds / effectiveTotal;
    return Math.max(48, fraction * availableHeight);
  });

  const naturalFillerHeight = remainingTime > 0
    ? Math.max(24, (remainingTime / effectiveTotal) * availableHeight)
    : 0;

  const naturalTotalHeight = naturalPairHeights.reduce((s, h) => s + h, 0)
    + naturalFillerHeight + totalGapSpace;

  // Apply zoom: interpolate between natural height and fit-to-container
  // zoom=0: natural (may scroll), zoom=1: fit everything in viewport
  const zoom = settings.zoom;
  const scaleFactor = naturalTotalHeight > containerHeight && zoom > 0
    ? 1 - zoom * (1 - containerHeight / naturalTotalHeight)
    : 1;

  const pairHeights = naturalPairHeights.map((h) => Math.max(48, h * scaleFactor));

  const fillerHeight = naturalFillerHeight > 0
    ? Math.max(24, naturalFillerHeight * scaleFactor)
    : 0;

  // Cumulative times for TC
  const cumulativeTimes: number[] = [];
  let runningTime = 0;
  for (const pair of pairs) {
    cumulativeTimes.push(runningTime);
    runningTime += pair.text.durationSeconds;
  }

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
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* Single scroll container for both columns */}
      <div className={`flex-1 overflow-y-auto ${scrollbarClass}`}>
        <div className="flex h-full min-h-0">
          {/* Left: Voice column */}
          <div className="flex-1 px-4 flex flex-col">
            <div className={`py-2 text-center flex-shrink-0 sticky top-0 z-20 ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Voice
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: GAP_PX }}>
              {pairs.map((pair, i) => (
                <div key={pair.id} style={{ height: pairHeights[i], minHeight: 48, flexShrink: 0 }}>
                  {/* Boundary zone */}
                  {i > 0 && (
                    <div
                      className="h-0 relative cursor-pointer group/boundary"
                      onClick={(e) => handleBoundaryClick(e, i)}
                    >
                      <div className="absolute -top-2 left-0 right-0 h-4 flex items-center justify-center opacity-0 group-hover/boundary:opacity-100 transition-opacity z-10">
                        <Plus size={10} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                      </div>
                    </div>
                  )}
                  <TextBubble
                    content={pair.text.content}
                    durationSeconds={pair.text.durationSeconds}
                    isFiller={pair.text.type === 'filler'}
                    onContentChange={(c) => onUpdateText(pair.id, c)}
                    onSplit={(offset) => onSplit(pair.id, offset)}
                    onDurationChange={(d) => onUpdateDuration(pair.id, 'text', d)}
                    cumulativeTime={cumulativeTimes[i]}
                    height={pairHeights[i]}
                  />
                </div>
              ))}
              {/* Auto filler: remaining time */}
              {fillerHeight > 0 && (
                <div style={{ height: fillerHeight, minHeight: 24, flexShrink: 0 }}>
                  <div className={`h-full rounded-3xl border border-dashed flex items-center justify-center select-none ${
                    dark
                      ? 'border-slate-700 bg-slate-900/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}>
                    <span className={`text-[10px] uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                      {formatTime(remainingTime)} remaining
                    </span>
                  </div>
                </div>
              )}
              {/* Over budget warning */}
              {overBudget && (
                <div className="py-2 flex-shrink-0">
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

          {/* Right: Visual column */}
          <div className="flex-1 px-4 flex flex-col">
            <div className={`py-2 text-center flex-shrink-0 sticky top-0 z-20 ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Visual
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: GAP_PX }}>
              {pairs.map((pair, i) => (
                <div key={pair.id} style={{ height: pairHeights[i], minHeight: 48, flexShrink: 0 }}>
                  <VisualBubble
                    content={pair.visual.content}
                    onContentChange={(c) => onUpdateVisual(pair.id, c)}
                    height={pairHeights[i]}
                  />
                </div>
              ))}
              {/* Mirror the filler space on the visual side */}
              {fillerHeight > 0 && (
                <div style={{ height: fillerHeight, minHeight: 24, flexShrink: 0 }}>
                  <div className={`h-full rounded-3xl border border-dashed ${
                    dark
                      ? 'border-slate-700 bg-slate-900/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
