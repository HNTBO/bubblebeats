import { useCallback } from 'react';
import type { BubblePair } from '../types/script';
import { TextBubble } from './TextBubble';
import { VisualBubble } from './VisualBubble';
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
  onDeletePair,
}: BubbleTimelineProps) {
  // Calculate cumulative time for each pair
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
    <div className="flex flex-1 overflow-y-auto">
      {/* Column headers */}
      <div className="flex flex-1">
        {/* Left: Text column */}
        <div className="flex-1 pl-10">
          <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-700 px-4 py-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Voiceover Text
            </span>
          </div>
          <div className="py-2 space-y-0">
            {pairs.map((pair, i) => (
              <div key={pair.id}>
                {/* Boundary zone - Ctrl+Click to insert filler */}
                {i > 0 && (
                  <div
                    className="h-2 flex items-center justify-center cursor-pointer group/boundary"
                    onClick={(e) => handleBoundaryClick(e, i)}
                  >
                    <div className="w-full mx-4 flex items-center justify-center opacity-0 group-hover/boundary:opacity-100 transition-opacity">
                      <div className="flex-1 h-px bg-slate-700" />
                      <Plus size={12} className="mx-1 text-slate-500" />
                      <div className="flex-1 h-px bg-slate-700" />
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
                />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-slate-700 flex-shrink-0" />

        {/* Right: Visual column */}
        <div className="flex-1">
          <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-700 px-4 py-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Visual Descriptions
            </span>
          </div>
          <div className="py-2 space-y-0">
            {pairs.map((pair, i) => (
              <div key={pair.id}>
                {i > 0 && <div className="h-2" />}
                <VisualBubble
                  content={pair.visual.content}
                  durationSeconds={pair.text.durationSeconds}
                  isFiller={pair.text.type === 'filler'}
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
