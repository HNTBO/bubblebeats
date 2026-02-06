import { useCallback, useRef, useEffect, useState } from 'react';
import type { BubblePair } from '../types/script';
import { TextBubble } from './TextBubble';
import { VisualBubble } from './VisualBubble';
import { estimateDuration, formatTime } from '../utils/timing';
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

  // Total duration to distribute across = max(textDuration, totalDuration)
  const effectiveTotal = Math.max(textDuration, totalDuration);

  // Calculate height per pair proportional to duration
  const pairHeights = pairs.map((p) => {
    const fraction = p.text.durationSeconds / effectiveTotal;
    return Math.max(48, fraction * containerHeight);
  });

  // Remaining time filler height
  const fillerHeight = remainingTime > 0
    ? Math.max(24, (remainingTime / effectiveTotal) * containerHeight)
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

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 h-full">
        {/* Left: Voice column */}
        <div className="flex-1 px-4 flex flex-col">
          <div className={`py-2 text-center flex-shrink-0 ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Voice
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
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
          <div className={`py-2 text-center flex-shrink-0 ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Visual
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
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
  );
}
