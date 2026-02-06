import { Header } from './components/Header';
import { BubbleTimeline } from './components/BubbleTimeline';
import { useScript } from './hooks/useScript';
import { SettingsContext, useSettingsProvider, useSettings } from './hooks/useSettings';

function AppContent() {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';

  const {
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
  } = useScript();

  const currentDuration = script.pairs.reduce(
    (sum, pair) => sum + pair.text.durationSeconds,
    0
  );

  return (
    <div className={`flex flex-col h-screen ${dark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <Header
        title={script.title}
        totalDuration={script.totalDurationSeconds}
        currentDuration={currentDuration}
        onTitleChange={setTitle}
        onDurationChange={setTotalDuration}
        onImport={setScript}
        script={script}
      />
      <BubbleTimeline
        pairs={script.pairs}
        totalDuration={script.totalDurationSeconds}
        onUpdateText={updatePairText}
        onCommitText={commitPairText}
        onUpdateVisual={updatePairVisual}
        onSplit={splitBubble}
        onInsertFiller={insertFiller}
        onUpdateDuration={updateBubbleDuration}
        onDeletePair={deletePair}
      />
      <footer className={`border-t px-6 py-1.5 text-[10px] flex justify-between ${
        dark ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'
      }`}>
        <span>Ctrl+Click text to split | Ctrl+Click boundary to add pause | Drag bottom edge to resize</span>
        <span>{script.pairs.length} segments</span>
      </footer>
    </div>
  );
}

function App() {
  const settingsCtx = useSettingsProvider();

  return (
    <SettingsContext.Provider value={settingsCtx}>
      <AppContent />
    </SettingsContext.Provider>
  );
}

export default App;
