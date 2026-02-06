import { useCallback, useRef, createRef } from 'react';
import type { BubblePair } from '../types/script';
import { TextBubble } from './TextBubble';
import { VisualBubble } from './VisualBubble';
import { formatTime } from '../utils/timing';
import { useSettings } from '../hooks/useSettings';
import { Plus } from 'lucide-react';

interface BubbleTimelineProps {
  pairs: BubblePair[];
  onUpdateText: (pairId: string, content: string) => void;
  onUpdateVisual: (pairId: string, content: string) => void;
  onSplit: (pairId: string, charOffset: number) => void;
  onInsertFiller: (atIndex: number) => void;
  onUpdateDuration: (pairId: string, side: 'text' | 'visual', duration: number) => void;
  onDeletePair: (pairId: string) => void;
}

export function BubbleTimeline({
  pairs,
  onUpdateText,
  onUpdateVisual,
  onSplit,
  onInsertFiller,
  onUpdateDuration,
}: BubbleTimelineProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';

  // Calculate cumulative time for each pair
  const cumulativeTimes: number[] = [];
  let runningTime = 0;
  for (const pair of pairs) {
    cumulativeTimes.push(runningTime);
    runningTime += pair.text.durationSeconds;
  }

  // Create refs for text bubbles so visual bubbles can match height
  const textBubbleRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());
  pairs.forEach((pair) => {
    if (!textBubbleRefs.current.has(pair.id)) {
      textBubbleRefs.current.set(pair.id, createRef<HTMLDivElement>());
    }
  });

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
    <div className="flex flex-1 overflow-y-auto">
      <div className="flex flex-1">
        {/* Left: Voice column */}
        <div className="flex-1 px-4">
          <div className={`sticky top-0 z-10 py-2 text-center ${
            dark ? 'bg-slate-950' : 'bg-slate-50'
          }`}>
            <span className={`text-xs font-medium uppercase tracking-wider ${
              dark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Voice
            </span>
          </div>
          <div>
            {pairs.map((pair, i) => (
              <div key={pair.id}>
                {/* Boundary zone */}
                {i > 0 && (
                  <div
                    className="h-1 flex items-center justify-center cursor-pointer group/boundary"
                    onClick={(e) => handleBoundaryClick(e, i)}
                  >
                    <div className="w-full flex items-center justify-center opacity-0 group-hover/boundary:opacity-100 transition-opacity">
                      <Plus size={10} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                    </div>
                  </div>
                )}
                {/* Timing centered between columns */}
                <div className="relative" ref={textBubbleRefs.current.get(pair.id)}>
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
              </div>
            ))}
          </div>
        </div>

        {/* Center: Timing indicators */}
        {!settings.minimal && (
          <div className="w-12 flex-shrink-0 pt-8">
            {pairs.map((pair, i) => (
              <div key={pair.id}>
                {i > 0 && <div className="h-1" />}
                <div className="flex items-start justify-center pt-2">
                  <span className={`text-[9px] font-mono ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {formatTime(cumulativeTimes[i])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Right: Visual column */}
        <div className="flex-1 px-4">
          <div className={`sticky top-0 z-10 py-2 text-center ${
            dark ? 'bg-slate-950' : 'bg-slate-50'
          }`}>
            <span className={`text-xs font-medium uppercase tracking-wider ${
              dark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Visual
            </span>
          </div>
          <div>
            {pairs.map((pair, i) => (
              <div key={pair.id}>
                {i > 0 && <div className="h-1" />}
                <VisualBubble
                  content={pair.visual.content}
                  textBubbleRef={textBubbleRefs.current.get(pair.id)!}
                  onContentChange={(c) => onUpdateVisual(pair.id, c)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
