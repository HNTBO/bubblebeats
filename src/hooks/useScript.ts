import { useState, useCallback } from 'react';
import type { Script, BubblePair, Bubble } from '../types/script';
import { generateId } from '../utils/ids';
import { estimateDuration } from '../utils/timing';

function createTextBubble(content: string): Bubble {
  return {
    id: generateId(),
    type: 'text',
    content,
    durationSeconds: Math.max(estimateDuration(content), 0.5),
  };
}

function createFillerBubble(duration = 1): Bubble {
  return {
    id: generateId(),
    type: 'filler',
    content: '',
    durationSeconds: duration,
    manualDuration: true,
  };
}

function createVisualBubble(content: string): Bubble {
  return {
    id: generateId(),
    type: 'text',
    content,
    durationSeconds: 0,
  };
}

function createPair(text: string, visual: string): BubblePair {
  return {
    id: generateId(),
    text: createTextBubble(text),
    visual: createVisualBubble(visual),
  };
}

export function createDefaultScript(): Script {
  return {
    title: 'Untitled Script',
    totalDurationSeconds: 120,
    pairs: [
      createPair('', ''),
    ],
  };
}

export function useScript(initial?: Script) {
  const [script, setScript] = useState<Script>(initial ?? createDefaultScript());

  const setTitle = useCallback((title: string) => {
    setScript((prev) => ({ ...prev, title }));
  }, []);

  const setTotalDuration = useCallback((totalDurationSeconds: number) => {
    setScript((prev) => ({ ...prev, totalDurationSeconds }));
  }, []);

  // Content-only update (no duration recalculation) — called on every keystroke
  const updatePairText = useCallback((pairId: string, content: string) => {
    setScript((prev) => ({
      ...prev,
      pairs: prev.pairs.map((p) =>
        p.id === pairId
          ? { ...p, text: { ...p.text, content } }
          : p
      ),
    }));
  }, []);

  // Recalculate duration from current content — called on blur
  const commitPairText = useCallback((pairId: string) => {
    setScript((prev) => ({
      ...prev,
      pairs: prev.pairs.map((p) =>
        p.id === pairId && !p.text.manualDuration
          ? {
              ...p,
              text: {
                ...p.text,
                durationSeconds: Math.max(estimateDuration(p.text.content), 0.5),
              },
            }
          : p
      ),
    }));
  }, []);

  const updatePairVisual = useCallback((pairId: string, content: string) => {
    setScript((prev) => ({
      ...prev,
      pairs: prev.pairs.map((p) =>
        p.id === pairId
          ? { ...p, visual: { ...p.visual, content } }
          : p
      ),
    }));
  }, []);

  const updateBubbleDuration = useCallback(
    (pairId: string, side: 'text' | 'visual', durationSeconds: number) => {
      setScript((prev) => ({
        ...prev,
        pairs: prev.pairs.map((p) => {
          if (p.id !== pairId) return p;
          // Enforce 1s minimum for fillers
          const min = p.text.type === 'filler' && side === 'text' ? 1 : 0.5;
          return {
            ...p,
            [side]: {
              ...p[side],
              durationSeconds: Math.max(min, durationSeconds),
              manualDuration: true,
            },
          };
        }),
      }));
    },
    []
  );

  const splitBubble = useCallback(
    (pairId: string, charOffset: number) => {
      setScript((prev) => {
        const idx = prev.pairs.findIndex((p) => p.id === pairId);
        if (idx === -1) return prev;

        const pair = prev.pairs[idx];
        const textBefore = pair.text.content.slice(0, charOffset).trim();
        const textAfter = pair.text.content.slice(charOffset).trim();

        if (!textBefore || !textAfter) return prev;

        const ratio = charOffset / pair.text.content.length;
        const visualSplitPos = Math.round(pair.visual.content.length * ratio);
        const visualBefore = pair.visual.content.slice(0, visualSplitPos).trim();
        const visualAfter = pair.visual.content.slice(visualSplitPos).trim();

        const newPair1 = createPair(textBefore, visualBefore || pair.visual.content);
        const newPair2 = createPair(textAfter, visualAfter || '');

        const newPairs = [...prev.pairs];
        newPairs.splice(idx, 1, newPair1, newPair2);

        return { ...prev, pairs: newPairs };
      });
    },
    []
  );

  const insertFiller = useCallback((atIndex: number) => {
    setScript((prev) => {
      const newPairs = [...prev.pairs];

      // Check if insertion point is inside a visual span (pair at atIndex has visualSpan=0)
      if (atIndex < newPairs.length && newPairs[atIndex].visualSpan === 0) {
        // Find span owner by walking up
        let ownerIdx = atIndex - 1;
        while (ownerIdx > 0 && newPairs[ownerIdx].visualSpan === 0) {
          ownerIdx--;
        }
        const ownerSpan = newPairs[ownerIdx].visualSpan ?? 1;
        const spanBefore = atIndex - ownerIdx;
        const spanAfter = ownerSpan - spanBefore;

        // Shrink owner's span to cover only up to the insertion point
        newPairs[ownerIdx] = {
          ...newPairs[ownerIdx],
          visualSpan: spanBefore === 1 ? undefined : spanBefore,
        };

        // The pair at atIndex becomes the new span owner for the rest
        newPairs[atIndex] = {
          ...newPairs[atIndex],
          visual: createVisualBubble(''),
          visualSpan: spanAfter === 1 ? undefined : spanAfter,
        };
      }

      const fillerPair: BubblePair = {
        id: generateId(),
        text: createFillerBubble(),
        visual: createVisualBubble(''),
      };
      newPairs.splice(atIndex, 0, fillerPair);
      return { ...prev, pairs: newPairs };
    });
  }, []);

  const deletePair = useCallback((pairId: string) => {
    setScript((prev) => ({
      ...prev,
      pairs: prev.pairs.filter((p) => p.id !== pairId),
    }));
  }, []);

  const mergePairUp = useCallback((pairId: string) => {
    setScript((prev) => {
      const idx = prev.pairs.findIndex((p) => p.id === pairId);
      if (idx <= 0) return prev;

      const above = prev.pairs[idx - 1];
      const current = prev.pairs[idx];

      const mergedTextContent = [above.text.content, current.text.content]
        .filter(Boolean)
        .join('\n');
      const mergedVisualContent = [above.visual.content, current.visual.content]
        .filter(Boolean)
        .join('\n');

      const mergedPair: BubblePair = {
        ...above,
        text: {
          ...above.text,
          content: mergedTextContent,
          durationSeconds: Math.max(estimateDuration(mergedTextContent), 0.5),
          manualDuration: undefined,
        },
        visual: {
          ...above.visual,
          content: mergedVisualContent,
        },
        visualSpan: (above.visualSpan ?? 1) + (current.visualSpan ?? 1) - 1,
      };
      // Normalize visualSpan: 1 → undefined
      if (mergedPair.visualSpan === 1) mergedPair.visualSpan = undefined;

      const newPairs = [...prev.pairs];
      newPairs.splice(idx - 1, 2, mergedPair);
      return { ...prev, pairs: newPairs };
    });
  }, []);

  const mergePairDown = useCallback((pairId: string) => {
    setScript((prev) => {
      const idx = prev.pairs.findIndex((p) => p.id === pairId);
      if (idx === -1 || idx >= prev.pairs.length - 1) return prev;

      const current = prev.pairs[idx];
      const below = prev.pairs[idx + 1];

      const mergedTextContent = [current.text.content, below.text.content]
        .filter(Boolean)
        .join('\n');
      const mergedVisualContent = [current.visual.content, below.visual.content]
        .filter(Boolean)
        .join('\n');

      const mergedPair: BubblePair = {
        ...current,
        text: {
          ...current.text,
          content: mergedTextContent,
          durationSeconds: Math.max(estimateDuration(mergedTextContent), 0.5),
          manualDuration: undefined,
        },
        visual: {
          ...current.visual,
          content: mergedVisualContent,
        },
        visualSpan: (current.visualSpan ?? 1) + (below.visualSpan ?? 1) - 1,
      };
      if (mergedPair.visualSpan === 1) mergedPair.visualSpan = undefined;

      const newPairs = [...prev.pairs];
      newPairs.splice(idx, 2, mergedPair);
      return { ...prev, pairs: newPairs };
    });
  }, []);

  const mergeVisualUp = useCallback((pairId: string) => {
    setScript((prev) => {
      const idx = prev.pairs.findIndex((p) => p.id === pairId);
      if (idx <= 0) return prev;

      // Walk up to find the span owner
      let ownerIdx = idx - 1;
      while (ownerIdx > 0 && prev.pairs[ownerIdx].visualSpan === 0) {
        ownerIdx--;
      }

      const owner = prev.pairs[ownerIdx];
      const current = prev.pairs[idx];

      const mergedVisualContent = [owner.visual.content, current.visual.content]
        .filter(Boolean)
        .join('\n');

      const newPairs = prev.pairs.map((p, i) => {
        if (i === ownerIdx) {
          return {
            ...p,
            visual: { ...p.visual, content: mergedVisualContent },
            visualSpan: (owner.visualSpan ?? 1) + (current.visualSpan ?? 1),
          };
        }
        if (i === idx) {
          return { ...p, visualSpan: 0 };
        }
        return p;
      });

      return { ...prev, pairs: newPairs };
    });
  }, []);

  const mergeVisualDown = useCallback((pairId: string) => {
    setScript((prev) => {
      const idx = prev.pairs.findIndex((p) => p.id === pairId);
      if (idx === -1 || idx >= prev.pairs.length - 1) return prev;

      const current = prev.pairs[idx];
      const below = prev.pairs[idx + 1];

      const mergedVisualContent = [current.visual.content, below.visual.content]
        .filter(Boolean)
        .join('\n');

      const newPairs = prev.pairs.map((p, i) => {
        if (i === idx) {
          return {
            ...p,
            visual: { ...p.visual, content: mergedVisualContent },
            visualSpan: (current.visualSpan ?? 1) + (below.visualSpan ?? 1),
          };
        }
        if (i === idx + 1) {
          return { ...p, visualSpan: 0 };
        }
        return p;
      });

      return { ...prev, pairs: newPairs };
    });
  }, []);

  const splitVisualSpan = useCallback((atPairIndex: number) => {
    setScript((prev) => {
      const pair = prev.pairs[atPairIndex];
      if (!pair || pair.visualSpan !== 0) return prev;

      // Walk up to find span owner
      let ownerIdx = atPairIndex - 1;
      while (ownerIdx > 0 && prev.pairs[ownerIdx].visualSpan === 0) {
        ownerIdx--;
      }
      const ownerSpan = prev.pairs[ownerIdx].visualSpan ?? 1;
      const spanBefore = atPairIndex - ownerIdx;
      const spanAfter = ownerSpan - spanBefore;

      const newPairs = prev.pairs.map((p, i) => {
        if (i === ownerIdx) {
          return { ...p, visualSpan: spanBefore === 1 ? undefined : spanBefore };
        }
        if (i === atPairIndex) {
          return {
            ...p,
            visual: createVisualBubble(''),
            visualSpan: spanAfter === 1 ? undefined : spanAfter,
          };
        }
        return p;
      });

      return { ...prev, pairs: newPairs };
    });
  }, []);

  return {
    script,
    setScript,
    setTitle,
    setTotalDuration,
    updatePairText,
    commitPairText,
    updatePairVisual,
    updateBubbleDuration,
    splitBubble,
    insertFiller,
    deletePair,
    mergePairUp,
    mergePairDown,
    mergeVisualUp,
    mergeVisualDown,
    splitVisualSpan,
  };
}
