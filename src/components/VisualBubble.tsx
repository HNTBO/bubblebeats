import { useRef, useLayoutEffect, useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useSettings } from '../hooks/useSettings';
import { X, ImagePlus } from 'lucide-react';
import { PopOverlay } from './PopOverlay';

interface VisualBubbleProps {
  content: string;
  onContentChange: (content: string) => void;
  showPlaceholder?: boolean;
  pairIndex: number;
  totalPairs: number;
  onMergeVisualUp: () => void;
  onMergeVisualDown: () => void;
  imageId?: string;
  onImageChange?: (imageId: string | undefined) => void;
}

export function VisualBubble({
  content,
  onContentChange,
  showPlaceholder = false,
  pairIndex,
  totalPairs,
  onMergeVisualUp,
  onMergeVisualDown,
  imageId,
  onImageChange,
}: VisualBubbleProps) {
  const { settings } = useSettings();
  const dark = settings.theme === 'dark';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPop, setShowPop] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const removeImage = useMutation(api.images.removeImage);
  const imageUrl = useQuery(
    api.images.getImageUrl,
    imageId ? { storageId: imageId as never } : "skip"
  );

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = el.scrollHeight + 'px';
  }, [content]);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') || !onImageChange) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();
      onImageChange(storageId);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [generateUploadUrl, onImageChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleRemoveImage = useCallback(async () => {
    if (!imageId || !onImageChange) return;
    onImageChange(undefined);
    try {
      await removeImage({ storageId: imageId as never });
    } catch (err) {
      console.error('Image removal failed:', err);
    }
  }, [imageId, onImageChange, removeImage]);

  return (
    <div
      className={`relative group rounded-3xl border p-4 h-full ${
        dark
          ? 'border-emerald-800/40 bg-emerald-950/20'
          : 'border-emerald-200 bg-emerald-50/50'
      } ${dragging ? (dark ? 'ring-2 ring-emerald-500/50' : 'ring-2 ring-emerald-300') : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Pop icon — top right, on hover */}
      <button
        className={`absolute top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${dark ? 'text-emerald-600 hover:text-emerald-300' : 'text-emerald-400 hover:text-emerald-600'}`}
        onClick={(e) => { e.stopPropagation(); setShowPop(true); }}
      >
        <X size={14} />
      </button>

      {/* Pop Overlay */}
      {showPop && (
        <PopOverlay
          mode="visual"
          canMergeUp={pairIndex > 0}
          canMergeDown={pairIndex < totalPairs - 1}
          onMergeUp={() => { setShowPop(false); onMergeVisualUp(); }}
          onMergeDown={() => { setShowPop(false); onMergeVisualDown(); }}
          onExit={() => setShowPop(false)}
        />
      )}

      {/* Image display */}
      {imageUrl && (
        <div className="relative mb-2 group/img">
          <img
            src={imageUrl}
            alt=""
            className="w-full rounded-xl object-cover max-h-40"
          />
          <button
            className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity ${
              dark ? 'bg-slate-900/80 text-red-400 hover:text-red-300' : 'bg-white/80 text-red-500 hover:text-red-600'
            }`}
            onClick={handleRemoveImage}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Upload indicator */}
      {uploading && (
        <div className={`flex items-center gap-2 mb-2 text-xs ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
          Uploading...
        </div>
      )}

      {/* Drop zone hint when dragging */}
      {dragging && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-3xl z-20 ${
          dark ? 'bg-emerald-950/80' : 'bg-emerald-50/80'
        }`}>
          <div className={`flex items-center gap-2 text-sm ${dark ? 'text-emerald-300' : 'text-emerald-600'}`}>
            <ImagePlus size={18} />
            Drop image here
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className={`w-full bg-transparent text-sm outline-none resize-none leading-relaxed overflow-hidden italic ${
          dark ? 'text-emerald-300/80' : 'text-emerald-700/80'
        }`}
        placeholder={showPlaceholder ? 'Describe the visual...' : undefined}
      />
    </div>
  );
}
