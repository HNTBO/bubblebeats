import { Header } from './components/Header';
import { BubbleTimeline } from './components/BubbleTimeline';
import { useScript } from './hooks/useScript';

function App() {
  const {
    script,
    setTitle,
    setTotalDuration,
    updatePairText,
    updatePairVisual,
    updateBubbleDuration,
    splitBubble,
    insertFiller,
    deletePair,
  } = useScript();

  // Sum of all text bubble durations
  const currentDuration = script.pairs.reduce(
    (sum, pair) => sum + pair.text.durationSeconds,
    0
  );

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <Header
        title={script.title}
        totalDuration={script.totalDurationSeconds}
        currentDuration={currentDuration}
        onTitleChange={setTitle}
        onDurationChange={setTotalDuration}
      />
      <BubbleTimeline
        pairs={script.pairs}
        onUpdateText={updatePairText}
        onUpdateVisual={updatePairVisual}
        onSplit={splitBubble}
        onInsertFiller={insertFiller}
        onUpdateDuration={updateBubbleDuration}
        onDeletePair={deletePair}
      />
      <footer className="border-t border-slate-800 px-6 py-1.5 text-[10px] text-slate-600 flex justify-between">
        <span>Ctrl+Click text to split | Ctrl+Click boundary to add pause | Drag bottom edge to resize</span>
        <span>{script.pairs.length} segments</span>
      </footer>
    </div>
  );
}

export default App;
