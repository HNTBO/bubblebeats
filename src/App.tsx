import { useEffect, useRef, useCallback } from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { Header } from './components/Header';
import { BubbleTimeline } from './components/BubbleTimeline';
import { useScript } from './hooks/useScript';
import { SettingsContext, useSettingsProvider, useSettings } from './hooks/useSettings';
import { StorageContext, useStorageProvider, useStorage } from './hooks/useStorage';
import { MigrationBanner } from './components/MigrationBanner';
import type { Script } from './types/script';

function AppContent() {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  const storage = useStorage();
  const { user } = useUser();

  const {
    script,
    setScript,
    setTitle,
    setTotalDuration,
    updatePairText,
    commitPairText,
    updatePairVisual,
    updateBubbleImage,
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
    if (bootstrapped.current || storage.isLoading) return;
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
  }, [storage.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Auto-save with 1s debounce ---
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scriptRef = useRef(script);
  scriptRef.current = script;

  useEffect(() => {
    if (!storage.currentFileId || !bootstrapped.current || storage.currentFileId.startsWith('pending-')) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (storage.currentFileId && !storage.currentFileId.startsWith('pending-')) {
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
    if (storage.currentFileId && !storage.currentFileId.startsWith('pending-')) {
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
    if (storage.currentFileId && !storage.currentFileId.startsWith('pending-')) {
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
    if (storage.currentFileId && !storage.currentFileId.startsWith('pending-')) {
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

  if (storage.isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen ${dark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Loading scripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${dark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <MigrationBanner />
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
        userName={user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? 'User'}
      />
      <BubbleTimeline
        pairs={script.pairs}
        totalDuration={script.totalDurationSeconds}
        onUpdateText={updatePairText}
        onCommitText={commitPairText}
        onUpdateVisual={updatePairVisual}
        onUpdateImage={updateBubbleImage}
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

function LoginScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-sky-500 mb-2 tracking-tight">BubbleBeats</h1>
        <p className="text-slate-400 text-sm mb-8">Visual script timing editor</p>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
    </div>
  );
}

function App() {
  const settingsCtx = useSettingsProvider();

  return (
    <SettingsContext.Provider value={settingsCtx}>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <LoginScreen />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
    </SettingsContext.Provider>
  );
}

function AuthenticatedApp() {
  const storageCtx = useStorageProvider();

  return (
    <StorageContext.Provider value={storageCtx}>
      <AppContent />
    </StorageContext.Provider>
  );
}

export default App;
