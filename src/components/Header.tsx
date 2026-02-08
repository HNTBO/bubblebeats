import { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Menu, FileDown, FileUp, Moon, Sun, Info, EyeOff, FilePlus, Trash2, LogOut, User } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { formatTime } from '../utils/timing';
import { useSettings } from '../hooks/useSettings';
import { parseScriptMarkdown } from '../utils/parseMarkdown';
import { exportToMarkdown, exportToJson, downloadFile } from '../utils/exportMarkdown';
import type { Script, FileEntry } from '../types/script';

interface HeaderProps {
  title: string;
  totalDuration: number;
  currentDuration: number;
  onTitleChange: (title: string) => void;
  onDurationChange: (seconds: number) => void;
  onImport: (script: Script) => void;
  script: Script;
  files: FileEntry[];
  currentFileId: string | null;
  onSwitchFile: (id: string) => void;
  onNewScript: () => void;
  onDeleteFile: (id: string) => void;
  userName?: string;
}

export function Header({
  title,
  totalDuration,
  currentDuration,
  onTitleChange,
  onDurationChange,
  onImport,
  script,
  files,
  currentFileId,
  onSwitchFile,
  onNewScript,
  onDeleteFile,
  userName,
}: HeaderProps) {
  const { settings, toggleTheme, toggleInfoMode, setZoom } = useSettings();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overflow = currentDuration > totalDuration;
  const dark = settings.theme === 'dark';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setExportMenuOpen(false);
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
          const parsed = parseScriptMarkdown(content);
          onImport(parsed);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [onImport]
  );

  const handleExportMarkdown = useCallback(() => {
    const md = exportToMarkdown(script);
    const filename = script.title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
    downloadFile(md, `${filename || 'script'}.md`, 'text/markdown');
    setMenuOpen(false);
    setExportMenuOpen(false);
  }, [script]);

  const handleExportJson = useCallback(() => {
    const json = exportToJson(script);
    const filename = script.title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
    downloadFile(json, `${filename || 'script'}.json`, 'application/json');
    setMenuOpen(false);
    setExportMenuOpen(false);
  }, [script]);

  const sortedFiles = [...files].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <header className={`flex items-center gap-4 border-b px-6 py-3 ${
      dark
        ? 'border-slate-700 bg-slate-900'
        : 'border-slate-200 bg-white'
    }`}>
      <h1 className="text-lg font-semibold text-pink-400 tracking-tight">
        BubbleBeats
      </h1>

      <div className={`mx-2 h-6 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
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
        <span className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>100%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-20 h-1 accent-violet-500"
        />
        <span className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Fit</span>
      </div>

      <div className={`mx-1 h-6 w-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

      {/* Duration */}
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
              ? 'bg-slate-800 text-slate-300 border-slate-600 focus:border-violet-500'
              : 'bg-slate-50 text-slate-700 border-slate-300 focus:border-violet-500'
          }`}
          min={1}
          step={10}
        />
        <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>sec</span>
      </div>

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
          <div className={`absolute right-0 top-full mt-1 w-56 rounded-xl border shadow-lg z-50 py-1 ${
            dark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200'
          }`}>
            {/* New script */}
            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => { onNewScript(); setMenuOpen(false); }}
            >
              <FilePlus size={15} />
              New script
            </button>

            {/* Saved scripts list */}
            {sortedFiles.length > 0 && (
              <>
                <div className={`my-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-100'}`} />
                <div className="max-h-48 overflow-y-auto">
                  {sortedFiles.map((file) => {
                    const isActive = file.id === currentFileId;
                    return (
                      <div
                        key={file.id}
                        className={`group flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                          isActive
                            ? dark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-600'
                            : dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => { if (!isActive) { onSwitchFile(file.id); setMenuOpen(false); } }}
                      >
                        <span className="truncate flex-1">{file.title || 'Untitled'}</span>
                        {!isActive && (
                          <button
                            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                              dark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                            }`}
                            onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className={`my-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-100'}`} />

            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={handleImport}
            >
              <FileUp size={15} />
              Import script...
            </button>

            {/* Export submenu */}
            <div className="relative">
              <button
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                <FileDown size={15} />
                Export...
              </button>
              {exportMenuOpen && (
                <div className={`ml-4 border-l pl-2 ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm transition-colors rounded ${
                      dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={handleExportMarkdown}
                  >
                    Markdown (.md)
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm transition-colors rounded ${
                      dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={handleExportJson}
                  >
                    JSON (.json)
                  </button>
                </div>
              )}
            </div>

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

            <div className={`my-1 h-px ${dark ? 'bg-slate-700' : 'bg-slate-100'}`} />

            {/* User info + sign out */}
            <div className={`px-4 py-2 text-xs flex items-center gap-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              <User size={13} />
              <span className="truncate">{userName}</span>
            </div>
            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => { signOut(); setMenuOpen(false); }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
