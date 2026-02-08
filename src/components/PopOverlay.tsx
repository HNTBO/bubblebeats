import { useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Trash2, X } from 'lucide-react';

interface PopOverlayProps {
  mode: 'text' | 'visual';
  canMergeUp: boolean;
  canMergeDown: boolean;
  onMergeUp: () => void;
  onMergeDown: () => void;
  onErase?: () => void;
  onExit: () => void;
}

export function PopOverlay({
  mode,
  canMergeUp,
  canMergeDown,
  onMergeUp,
  onMergeDown,
  onErase,
  onExit,
}: PopOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Esc to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onExit();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // Click outside to close
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onExit();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onExit]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 rounded-3xl bg-black/45 backdrop-blur-sm z-20 flex items-center justify-center min-h-[140px]"
    >
      {/* Top: Merge Up */}
      {canMergeUp && (
        <button
          className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5"
          onClick={(e) => { e.stopPropagation(); onMergeUp(); }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center">
            <ChevronUp size={16} className="text-white" />
          </div>
          <span className="text-[9px] text-white/80">merge up</span>
        </button>
      )}

      {/* Bottom: Merge Down */}
      {canMergeDown && (
        <button
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5"
          onClick={(e) => { e.stopPropagation(); onMergeDown(); }}
        >
          <span className="text-[9px] text-white/80">merge down</span>
          <div className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center">
            <ChevronDown size={16} className="text-white" />
          </div>
        </button>
      )}

      {/* Left: Erase (text mode only) */}
      {mode === 'text' && onErase && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
          onClick={(e) => { e.stopPropagation(); onErase(); }}
        >
          <div className="w-8 h-8 rounded-lg bg-white/20 hover:bg-red-500/40 transition-colors flex items-center justify-center">
            <Trash2 size={14} className="text-white" />
          </div>
          <span className="text-[9px] text-white/80">pop</span>
        </button>
      )}

      {/* Right: Exit */}
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
        onClick={(e) => { e.stopPropagation(); onExit(); }}
      >
        <div className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center">
          <X size={14} className="text-white" />
        </div>
        <span className="text-[9px] text-white/80">exit</span>
      </button>
    </div>
  );
}
