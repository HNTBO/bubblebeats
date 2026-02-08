import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Script } from '../types/script';

const FILES_KEY = 'bubblebeats-files';
const FILE_PREFIX = 'bubblebeats-file-';

interface LegacyFileEntry {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
}

function getLegacyScripts(): { entry: LegacyFileEntry; script: Script }[] {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    if (!raw) return [];
    const entries: LegacyFileEntry[] = JSON.parse(raw);
    const results: { entry: LegacyFileEntry; script: Script }[] = [];
    for (const entry of entries) {
      const scriptRaw = localStorage.getItem(FILE_PREFIX + entry.id);
      if (scriptRaw) {
        results.push({ entry, script: JSON.parse(scriptRaw) });
      }
    }
    return results;
  } catch {
    return [];
  }
}

function clearLegacyStorage() {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    if (raw) {
      const entries: LegacyFileEntry[] = JSON.parse(raw);
      for (const entry of entries) {
        localStorage.removeItem(FILE_PREFIX + entry.id);
      }
      localStorage.removeItem(FILES_KEY);
    }
    localStorage.removeItem('bubblebeats-current');
  } catch { /* ignore */ }
}

export function MigrationBanner() {
  const createMutation = useMutation(api.scripts.create);

  const [legacyScripts] = useState(() => getLegacyScripts());
  const [dismissed, setDismissed] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [done, setDone] = useState(false);

  const handleMigrate = useCallback(async () => {
    setMigrating(true);
    try {
      for (const { script } of legacyScripts) {
        await createMutation({
          title: script.title,
          totalDurationSeconds: script.totalDurationSeconds,
          pairs: script.pairs,
        });
      }
      clearLegacyStorage();
      setDone(true);
    } catch (err) {
      console.error('Migration failed:', err);
    } finally {
      setMigrating(false);
    }
  }, [legacyScripts, createMutation]);

  if (legacyScripts.length === 0 || dismissed) return null;

  if (done) {
    return (
      <div className="px-6 py-2 text-sm flex items-center justify-between bg-surface-active text-accent-soft">
        <span>Imported {legacyScripts.length} script{legacyScripts.length !== 1 ? 's' : ''} from local storage.</span>
        <button
          className="text-xs underline text-accent"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-2 text-sm flex items-center justify-between bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      <span>
        Found {legacyScripts.length} script{legacyScripts.length !== 1 ? 's' : ''} in local storage. Import to your cloud account?
      </span>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded text-xs font-medium bg-amber-200 text-amber-800 hover:bg-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:hover:bg-amber-600"
          onClick={handleMigrate}
          disabled={migrating}
        >
          {migrating ? 'Importing...' : 'Import'}
        </button>
        <button
          className="px-3 py-1 rounded text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
          onClick={() => setDismissed(true)}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
