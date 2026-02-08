import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, FileDown, FileUp, Moon, Sun, Info, EyeOff, FilePlus, Trash2, LogOut, User } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useSettings } from '../hooks/useSettings';
import { parseScriptMarkdown } from '../utils/parseMarkdown';
import { exportToMarkdown, exportToJson, downloadFile } from '../utils/exportMarkdown';
import { Logo } from './Logo';
import type { Script, FileEntry } from '../types/script';

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
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
  onTitleChange,
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
    <header className="relative flex items-center border-b border-stroke-strong px-6 py-3 bg-surface-alt">
      {/* Logo — left */}
      <Logo height={18} className="text-text-primary shrink-0" onBubbleClick={toggleTheme} />

      {/* Title — absolutely centered on the header */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
          className="pointer-events-auto bg-transparent text-sm font-medium outline-none border-b border-transparent px-1 py-0.5 text-center min-w-48 text-text-primary focus:border-accent"
          placeholder="Script title..."
        />
      </div>

      <div className="flex-1" />

      {/* Right side: zoom slider + hamburger */}
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-10 h-0.5 accent-accent"
        />

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
            className="p-2 rounded-lg transition-colors hover:bg-surface-hover text-text-secondary"
          >
            <Menu size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-stroke-strong shadow-lg z-50 py-1 bg-surface-overlay">
              {/* New script */}
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-surface-hover"
                onClick={() => { onNewScript(); setMenuOpen(false); }}
              >
                <FilePlus size={15} />
                New script
              </button>

              {/* Saved scripts list */}
              {sortedFiles.length > 0 && (
                <>
                  <div className="my-1 h-px bg-stroke-subtle" />
                  <div className="max-h-48 overflow-y-auto">
                    {sortedFiles.map((file) => {
                      const isActive = file.id === currentFileId;
                      return (
                        <div
                          key={file.id}
                          className={`group flex items-center gap-2 px-4 py-2 text-sm transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-surface-active text-accent-soft'
                              : 'text-text-primary hover:bg-surface-hover'
                          }`}
                          onClick={() => { if (!isActive) { onSwitchFile(file.id); setMenuOpen(false); } }}
                        >
                          <span className="truncate flex-1">{file.title || 'Untitled'}</span>
                          {!isActive && (
                            <button
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity text-text-muted hover:text-danger"
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

              <div className="my-1 h-px bg-stroke-subtle" />

              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-surface-hover"
                onClick={handleImport}
              >
                <FileUp size={15} />
                Import script...
              </button>

              {/* Export submenu */}
              <div className="relative">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-surface-hover"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                >
                  <FileDown size={15} />
                  Export...
                </button>
                {exportMenuOpen && (
                  <div className="ml-4 border-l border-stroke-strong pl-2">
                    <button
                      className="w-full text-left px-3 py-2 text-sm transition-colors rounded text-text-primary hover:bg-surface-hover"
                      onClick={handleExportMarkdown}
                    >
                      Markdown (.md)
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm transition-colors rounded text-text-primary hover:bg-surface-hover"
                      onClick={handleExportJson}
                    >
                      JSON (.json)
                    </button>
                  </div>
                )}
              </div>

              <div className="my-1 h-px bg-stroke-subtle" />

              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-surface-hover"
                onClick={() => { toggleTheme(); }}
              >
                {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {settings.theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-surface-hover"
                onClick={() => { toggleInfoMode(); }}
              >
                {settings.infoMode ? <EyeOff size={15} /> : <Info size={15} />}
                {settings.infoMode ? 'Hide info' : 'Info mode'}
              </button>

              <div className="my-1 h-px bg-stroke-subtle" />

              {/* User info + sign out */}
              <div className="px-4 py-2 text-xs flex items-center gap-2 text-text-muted">
                <User size={13} />
                <span className="truncate">{userName}</span>
              </div>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-text-primary hover:bg-surface-hover"
                onClick={() => { signOut(); setMenuOpen(false); }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
