import { useState, useCallback, createContext, useContext, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Script } from '../types/script';
import { createDefaultScript } from './useScript';

interface FileEntry {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
}

interface StorageContextValue {
  files: FileEntry[];
  currentFileId: string | null;
  loadFile: (id: string) => Script | null;
  saveFile: (id: string, script: Script) => void;
  createFile: (script?: Script) => { id: string; script: Script };
  deleteFile: (id: string) => void;
  setCurrentFileId: (id: string) => void;
  updateFileTitle: (id: string, title: string) => void;
  isLoading: boolean;
}

export const StorageContext = createContext<StorageContextValue>({
  files: [],
  currentFileId: null,
  loadFile: () => null,
  saveFile: () => {},
  createFile: () => ({ id: '', script: createDefaultScript() }),
  deleteFile: () => {},
  setCurrentFileId: () => {},
  updateFileTitle: () => {},
  isLoading: true,
});

export function useStorageProvider(): StorageContextValue {
  const convexScripts = useQuery(api.scripts.list);
  const createMutation = useMutation(api.scripts.create);
  const updateMutation = useMutation(api.scripts.update);
  const removeMutation = useMutation(api.scripts.remove);

  const [currentFileId, setCurrentFileIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bubblebeats-current');
    } catch { return null; }
  });

  // Cache loaded scripts client-side to provide sync loadFile()
  const scriptCache = useRef<Map<string, Script>>(new Map());

  // Map Convex results to FileEntry format
  const files: FileEntry[] = (convexScripts ?? []).map((s) => ({
    id: s._id,
    title: s.title,
    updatedAt: s.updatedAt,
    createdAt: s.createdAt,
  }));

  // Sync Convex data into the local cache
  useEffect(() => {
    if (!convexScripts) return;
    for (const s of convexScripts) {
      scriptCache.current.set(s._id, {
        title: s.title,
        totalDurationSeconds: s.totalDurationSeconds,
        pairs: s.pairs,
      });
    }
  }, [convexScripts]);

  const setCurrentFileId = useCallback((id: string) => {
    setCurrentFileIdState(id);
    try { localStorage.setItem('bubblebeats-current', id); } catch { /* ignore */ }
  }, []);

  const loadFile = useCallback((id: string): Script | null => {
    return scriptCache.current.get(id) ?? null;
  }, []);

  // Debounce map for saves — prevents hammering Convex on every keystroke
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const saveFile = useCallback((id: string, script: Script) => {
    // Update cache immediately for local reads
    scriptCache.current.set(id, script);

    // Debounce the Convex mutation
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    saveTimers.current.set(id, setTimeout(() => {
      updateMutation({
        id: id as never,
        title: script.title,
        totalDurationSeconds: script.totalDurationSeconds,
        pairs: script.pairs,
      }).catch(console.error);
      saveTimers.current.delete(id);
    }, 1000));
  }, [updateMutation]);

  const createFile = useCallback((script?: Script) => {
    const s = script ?? createDefaultScript();
    // Create in Convex — returns a promise with the ID
    // We need a temporary ID for immediate use
    const tempId = `pending-${Date.now()}`;
    scriptCache.current.set(tempId, s);

    createMutation({
      title: s.title,
      totalDurationSeconds: s.totalDurationSeconds,
      pairs: s.pairs,
    }).then((convexId) => {
      // Move cache entry from temp to real ID
      scriptCache.current.delete(tempId);
      scriptCache.current.set(convexId, s);
      setCurrentFileIdState(convexId);
      try { localStorage.setItem('bubblebeats-current', convexId); } catch { /* ignore */ }
    }).catch(console.error);

    return { id: tempId, script: s };
  }, [createMutation]);

  const deleteFile = useCallback((id: string) => {
    scriptCache.current.delete(id);
    removeMutation({ id: id as never }).catch(console.error);
  }, [removeMutation]);

  const updateFileTitle = useCallback((id: string, title: string) => {
    const cached = scriptCache.current.get(id);
    if (cached) {
      cached.title = title;
    }
    updateMutation({
      id: id as never,
      title,
    }).catch(console.error);
  }, [updateMutation]);

  const isLoading = convexScripts === undefined;

  return {
    files,
    currentFileId,
    loadFile,
    saveFile,
    createFile,
    deleteFile,
    setCurrentFileId,
    updateFileTitle,
    isLoading,
  };
}

export function useStorage() {
  return useContext(StorageContext);
}
