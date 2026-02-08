import { useState, useCallback, useEffect, createContext, useContext } from 'react';

export interface Settings {
  theme: 'light' | 'dark';
  infoMode: boolean;
  zoom: number; // 0 = fill width (may scroll), 1 = fit height (no scroll)
}

interface SettingsContext {
  settings: Settings;
  toggleTheme: () => void;
  toggleInfoMode: () => void;
  setZoom: (zoom: number) => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  infoMode: true,
  zoom: 0.25,
};

export const SettingsContext = createContext<SettingsContext>({
  settings: defaultSettings,
  toggleTheme: () => {},
  toggleInfoMode: () => {},
  setZoom: () => {},
});

export function useSettingsProvider(): SettingsContext {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('bubblebeats-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // migrate old "minimal" key
        if ('minimal' in parsed) {
          return { theme: parsed.theme ?? 'light', infoMode: !parsed.minimal, zoom: 0 };
        }
        return { ...defaultSettings, ...parsed };
      }
    } catch { /* ignore */ }
    return defaultSettings;
  });

  const save = useCallback((s: Settings) => {
    setSettings(s);
    localStorage.setItem('bubblebeats-settings', JSON.stringify(s));
  }, []);

  const toggleTheme = useCallback(() => {
    save({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' });
  }, [settings, save]);

  const toggleInfoMode = useCallback(() => {
    save({ ...settings, infoMode: !settings.infoMode });
  }, [settings, save]);

  const setZoom = useCallback((zoom: number) => {
    save({ ...settings, zoom: Math.max(0, Math.min(1, zoom)) });
  }, [settings, save]);

  // Sync dark class on <html> for CSS custom properties + Tailwind dark: variant
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  return { settings, toggleTheme, toggleInfoMode, setZoom };
}

export function useSettings() {
  return useContext(SettingsContext);
}
