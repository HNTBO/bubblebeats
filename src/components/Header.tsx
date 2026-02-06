import { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Menu, FileDown, FileUp, Moon, Sun, Info, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';
import { formatTime } from '../utils/timing';
import { useSettings } from '../hooks/useSettings';
import { parseScriptMarkdown } from '../utils/parseMarkdown';
import type { Script } from '../types/script';

interface HeaderProps {
  title: string;
  totalDuration: number;
  currentDuration: number;
  onTitleChange: (title: string) => void;
  onDurationChange: (seconds: number) => void;
  onImport: (script: Script) => void;
}

export function Header({
  title,
  totalDuration,
  currentDuration,
  onTitleChange,
  onDurationChange,
  onImport,
}: HeaderProps) {
  const { settings, toggleTheme, toggleInfoMode, setZoom } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overflow = currentDuration > totalDuration;
  const dark = settings.theme === 'dark';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
    setMenuOpen(false);
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) {
          const script = parseScriptMarkdown(content);
          onImport(script);
        }
      };
      reader.readAsText(file);

      // Reset input so the same file can be re-imported
      e.target.value = '';
    },
    [onImport]
  );

  return (
    <header className={`flex items-center gap-4 border-b px-6 py-3 ${
      dark
        ? 'border-slate-700 bg-slate-900'
        : 'border-slate-200 bg-white'
    }`}>
      <h1 className="text-lg font-semibold text-sky-500 tracking-tight">
        BubbleBeats
      </h1>

      <div className={`mx-2 h-6 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className={`bg-transparent text-sm font-medium outline-none border-b border-transparent px-1 py-0.5 min-w-48 ${
          dark
            ? 'text-slate-200 focus:border-slate-500'
            : 'text-slate-700 focus:border-slate-400'
        }`}
        placeholder="Script title..."
      />

      <div className="flex-1" />

      {/* Zoom slider */}
      <div className="flex items-center gap-2">
        <ZoomOut size={13} className={dark ? 'text-slate-500' : 'text-slate-400'} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-20 h-1 accent-sky-500"
        />
        <ZoomIn size={13} className={dark ? 'text-slate-500' : 'text-slate-400'} />
      </div>

      <div className={`mx-1 h-6 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

      {/* Duration display */}
      <div className="flex items-center gap-2 text-sm">
        <Clock size={14} className={dark ? 'text-slate-400' : 'text-slate-500'} />
        <span className={overflow ? 'text-red-500 font-medium' : dark ? 'text-slate-300' : 'text-slate-600'}>
          {formatTime(currentDuration)}
        </span>
        <span className={dark ? 'text-slate-500' : 'text-slate-400'}>/</span>
        <input
          type="number"
          value={totalDuration}
          onChange={(e) => onDurationChange(Math.max(1, Number(e.target.value)))}
          className={`w-16 text-sm rounded px-2 py-0.5 border outline-none ${
            dark
              ? 'bg-slate-800 text-slate-300 border-slate-600 focus:border-sky-500'
              : 'bg-slate-50 text-slate-700 border-slate-300 focus:border-sky-500'
          }`}
          min={1}
          step={10}
        />
        <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>sec</span>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Hamburger menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 rounded-lg transition-colors ${
            dark
              ? 'hover:bg-slate-800 text-slate-400'
              : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <Menu size={18} />
        </button>

        {menuOpen && (
          <div className={`absolute right-0 top-full mt-1 w-52 rounded-xl border shadow-lg z-50 py-1 ${
            dark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200'
          }`}>
            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={handleImport}
            >
              <FileUp size={15} />
              Import script...
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => { /* TODO: export */ setMenuOpen(false); }}
            >
              <FileDown size={15} />
              Export...
            </button>

            <div className={`my-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-100'}`} />

            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => { toggleTheme(); }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => { toggleInfoMode(); }}
            >
              {settings.infoMode ? <EyeOff size={15} /> : <Info size={15} />}
              {settings.infoMode ? 'Hide info' : 'Info mode'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
