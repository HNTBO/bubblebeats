import { useState, useCallback, createContext, useContext } from 'react';

export interface Settings {
  theme: 'light' | 'dark';
  minimal: boolean;
}

interface SettingsContext {
  settings: Settings;
  toggleTheme: () => void;
  toggleMinimal: () => void;
}

const defaultSettings: Settings = {
  theme: 'light',
  minimal: false,
};

export const SettingsContext = createContext<SettingsContext>({
  settings: defaultSettings,
  toggleTheme: () => {},
  toggleMinimal: () => {},
});

export function useSettingsProvider(): SettingsContext {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('bubblebeats-settings');
      if (saved) return JSON.parse(saved);
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

  const toggleMinimal = useCallback(() => {
    save({ ...settings, minimal: !settings.minimal });
  }, [settings, save]);

  return { settings, toggleTheme, toggleMinimal };
}

export function useSettings() {
  return useContext(SettingsContext);
}
