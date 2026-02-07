import { useState, useCallback, createContext, useContext } from 'react';
import type { Script, FileEntry } from '../types/script';
import { createDefaultScript } from './useScript';
import { generateId } from '../utils/ids';

const FILES_KEY = 'bubblebeats-files';
const FILE_PREFIX = 'bubblebeats-file-';
const CURRENT_KEY = 'bubblebeats-current';

function readIndex(): FileEntry[] {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function writeIndex(entries: FileEntry[]) {
  localStorage.setItem(FILES_KEY, JSON.stringify(entries));
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
});

export function useStorageProvider(): StorageContextValue {
  const [files, setFiles] = useState<FileEntry[]>(() => readIndex());
  const [currentFileId, setCurrentFileIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_KEY);
    } catch { return null; }
  });

  const setCurrentFileId = useCallback((id: string) => {
    setCurrentFileIdState(id);
    localStorage.setItem(CURRENT_KEY, id);
  }, []);

  const loadFile = useCallback((id: string): Script | null => {
    try {
      const raw = localStorage.getItem(FILE_PREFIX + id);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }, []);

  const saveFile = useCallback((id: string, script: Script) => {
    localStorage.setItem(FILE_PREFIX + id, JSON.stringify(script));
    const now = Date.now();
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      let next: FileEntry[];
      if (idx === -1) {
        next = [...prev, { id, title: script.title, updatedAt: now, createdAt: now }];
      } else {
        next = prev.map((f) =>
          f.id === id ? { ...f, title: script.title, updatedAt: now } : f
        );
      }
      writeIndex(next);
      return next;
    });
  }, []);

  const createFile = useCallback((script?: Script) => {
    const id = generateId();
    const s = script ?? createDefaultScript();
    const now = Date.now();
    const entry: FileEntry = { id, title: s.title, updatedAt: now, createdAt: now };
    localStorage.setItem(FILE_PREFIX + id, JSON.stringify(s));
    setFiles((prev) => {
      const next = [...prev, entry];
      writeIndex(next);
      return next;
    });
    return { id, script: s };
  }, []);

  const deleteFile = useCallback((id: string) => {
    localStorage.removeItem(FILE_PREFIX + id);
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      writeIndex(next);
      return next;
    });
  }, []);

  const updateFileTitle = useCallback((id: string, title: string) => {
    setFiles((prev) => {
      const next = prev.map((f) =>
        f.id === id ? { ...f, title, updatedAt: Date.now() } : f
      );
      writeIndex(next);
      return next;
    });
  }, []);

  return { files, currentFileId, loadFile, saveFile, createFile, deleteFile, setCurrentFileId, updateFileTitle };
}

export function useStorage() {
  return useContext(StorageContext);
}
