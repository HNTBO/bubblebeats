import { Clock, FileDown } from 'lucide-react';
import { formatTime } from '../utils/timing';

interface HeaderProps {
  title: string;
  totalDuration: number;
  currentDuration: number;
  onTitleChange: (title: string) => void;
  onDurationChange: (seconds: number) => void;
}

export function Header({
  title,
  totalDuration,
  currentDuration,
  onTitleChange,
  onDurationChange,
}: HeaderProps) {
  const overflow = currentDuration > totalDuration;

  return (
    <header className="flex items-center gap-4 border-b border-slate-700 bg-slate-900 px-6 py-3">
      <h1 className="text-lg font-semibold text-sky-400 tracking-tight">
        BubbleBeats
      </h1>

      <div className="mx-2 h-6 w-px bg-slate-700" />

      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="bg-transparent text-slate-200 text-sm font-medium outline-none border-b border-transparent focus:border-slate-500 px-1 py-0.5 min-w-48"
        placeholder="Script title..."
      />

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-sm">
        <Clock size={14} className="text-slate-400" />
        <span className={overflow ? 'text-red-400 font-medium' : 'text-slate-300'}>
          {formatTime(currentDuration)}
        </span>
        <span className="text-slate-500">/</span>
        <input
          type="number"
          value={totalDuration}
          onChange={(e) => onDurationChange(Math.max(1, Number(e.target.value)))}
          className="w-16 bg-slate-800 text-slate-300 text-sm rounded px-2 py-0.5 border border-slate-600 outline-none focus:border-sky-500"
          min={1}
          step={10}
        />
        <span className="text-slate-500 text-xs">sec</span>
      </div>

      <button className="flex items-center gap-1.5 rounded bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 transition-colors">
        <FileDown size={14} />
        Export
      </button>
    </header>
  );
}
