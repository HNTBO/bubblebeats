import { useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { BubbleTimeline } from './components/BubbleTimeline';
import { useScript } from './hooks/useScript';
import { SettingsContext, useSettingsProvider, useSettings } from './hooks/useSettings';
import { StorageContext, useStorageProvider, useStorage } from './hooks/useStorage';
import type { Script } from './types/script';

function AppContent() {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  const storage = useStorage();

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
    mergePairUp,
    mergePairDown,
    mergeVisualUp,
    mergeVisualDown,
    splitVisualSpan,
  } = useScript();

  // --- Bootstrap: load or create initial file ---
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    if (storage.currentFileId) {
      const loaded = storage.loadFile(storage.currentFileId);
      if (loaded) {
        setScript(loaded);
        return;
      }
    }
    // No valid current file — check if any files exist
    if (storage.files.length > 0) {
      const latest = [...storage.files].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      const loaded = storage.loadFile(latest.id);
      if (loaded) {
        setScript(loaded);
        storage.setCurrentFileId(latest.id);
        return;
      }
    }
    // First visit — create default file
    const { id, script: newScript } = storage.createFile();
    setScript(newScript);
    storage.setCurrentFileId(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Auto-save with 1s debounce ---
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scriptRef = useRef(script);
  scriptRef.current = script;

  useEffect(() => {
    if (!storage.currentFileId || !bootstrapped.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (storage.currentFileId) {
        storage.saveFile(storage.currentFileId, scriptRef.current);
      }
    }, 1000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [script, storage.currentFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- File operations ---
  const handleSwitchFile = useCallback((id: string) => {
    // Save current file immediately before switching
    if (storage.currentFileId) {
      storage.saveFile(storage.currentFileId, scriptRef.current);
    }
    const loaded = storage.loadFile(id);
    if (loaded) {
      setScript(loaded);
      storage.setCurrentFileId(id);
    }
  }, [storage, setScript]);

  const handleNewScript = useCallback(() => {
    // Save current file first
    if (storage.currentFileId) {
      storage.saveFile(storage.currentFileId, scriptRef.current);
    }
    const { id, script: newScript } = storage.createFile();
    setScript(newScript);
    storage.setCurrentFileId(id);
  }, [storage, setScript]);

  const handleDeleteScript = useCallback((id: string) => {
    storage.deleteFile(id);
    if (storage.currentFileId === id) {
      // Switch to another file or create a new one
      const remaining = storage.files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        const next = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        const loaded = storage.loadFile(next.id);
        if (loaded) {
          setScript(loaded);
          storage.setCurrentFileId(next.id);
          return;
        }
      }
      // No files left — create new
      const { id: newId, script: newScript } = storage.createFile();
      setScript(newScript);
      storage.setCurrentFileId(newId);
    }
  }, [storage, setScript]);

  const handleImport = useCallback((imported: Script) => {
    // Save current file first
    if (storage.currentFileId) {
      storage.saveFile(storage.currentFileId, scriptRef.current);
    }
    // Create a new file from imported script
    const { id } = storage.createFile(imported);
    setScript(imported);
    storage.setCurrentFileId(id);
  }, [storage, setScript]);

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
        onImport={handleImport}
        script={script}
        files={storage.files}
        currentFileId={storage.currentFileId}
        onSwitchFile={handleSwitchFile}
        onNewScript={handleNewScript}
        onDeleteFile={handleDeleteScript}
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
        onMergePairUp={mergePairUp}
        onMergePairDown={mergePairDown}
        onMergeVisualUp={mergeVisualUp}
        onMergeVisualDown={mergeVisualDown}
        onSplitVisualSpan={splitVisualSpan}
      />
      <footer className={`border-t px-6 py-1.5 text-[10px] flex justify-between ${
        dark ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'
      }`}>
        <span>Double-click text to edit | Ctrl+Click to split | Click + to add pause | Drag pause edge to resize | Hover X to pop/merge</span>
        <span>{script.pairs.length} segments</span>
      </footer>
    </div>
  );
}

function App() {
  const settingsCtx = useSettingsProvider();
  const storageCtx = useStorageProvider();

  return (
    <SettingsContext.Provider value={settingsCtx}>
      <StorageContext.Provider value={storageCtx}>
        <AppContent />
      </StorageContext.Provider>
    </SettingsContext.Provider>
  );
}

export default App;
