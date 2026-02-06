import { useState, useCallback } from 'react';
import type { Script, BubblePair, Bubble } from '../types/script';
import { generateId } from '../utils/ids';
import { estimateDuration } from '../utils/timing';

function createTextBubble(content: string): Bubble {
  return {
    id: generateId(),
    type: 'text',
    content,
    durationSeconds: Math.max(estimateDuration(content), 1),
  };
}

function createFillerBubble(duration = 1.5): Bubble {
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

function createDefaultScript(): Script {
  return {
    title: 'Untitled Script',
    totalDurationSeconds: 120,
    pairs: [
      createPair(
        'Your opening line goes here...',
        'Describe the opening visual...'
      ),
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

  const updatePairText = useCallback((pairId: string, content: string) => {
    setScript((prev) => ({
      ...prev,
      pairs: prev.pairs.map((p) =>
        p.id === pairId
          ? {
              ...p,
              text: {
                ...p.text,
                content,
                durationSeconds: p.text.manualDuration
                  ? p.text.durationSeconds
                  : Math.max(estimateDuration(content), 1),
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
        pairs: prev.pairs.map((p) =>
          p.id === pairId
            ? {
                ...p,
                [side]: {
                  ...p[side],
                  durationSeconds,
                  manualDuration: true,
                },
              }
            : p
        ),
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

  /** Insert a filler/pause pair. Text side is filler, visual side is always editable. */
  const insertFiller = useCallback((atIndex: number) => {
    setScript((prev) => {
      const fillerPair: BubblePair = {
        id: generateId(),
        text: createFillerBubble(),
        visual: createVisualBubble(''),
      };
      const newPairs = [...prev.pairs];
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

  return {
    script,
    setScript,
    setTitle,
    setTotalDuration,
    updatePairText,
    updatePairVisual,
    updateBubbleDuration,
    splitBubble,
    insertFiller,
    deletePair,
  };
}
