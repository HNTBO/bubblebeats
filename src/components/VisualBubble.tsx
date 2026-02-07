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
  const dragCounter = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);

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

  const handleRemoveImage = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={`relative group rounded-3xl border p-4 h-full flex gap-3 ${
        dark
          ? 'border-emerald-800/40 bg-emerald-950/20'
          : 'border-emerald-200 bg-emerald-50/50'
      } ${dragging ? (dark ? 'ring-2 ring-emerald-500/50' : 'ring-2 ring-emerald-300') : ''}`}
      onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); }}
      onDragLeave={() => { dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); } }}
      onDrop={(e) => { dragCounter.current = 0; handleDrop(e); }}
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

      {/* Image thumbnail */}
      {imageUrl && (
        <div className="relative shrink-0 group/img self-start">
          <img
            src={imageUrl}
            alt=""
            className={`rounded-2xl object-contain cursor-pointer max-h-20 max-w-24 ${
              dark ? 'ring-1 ring-emerald-800/50' : 'ring-1 ring-emerald-200'
            }`}
            onClick={() => setLightbox(true)}
          />
          <button
            className={`absolute -top-1.5 -right-1.5 p-0.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity ${
              dark ? 'bg-slate-800 text-red-400 hover:text-red-300' : 'bg-white text-red-500 hover:text-red-600'
            } shadow-sm`}
            onClick={handleRemoveImage}
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Upload indicator */}
      {uploading && (
        <div className={`flex items-center gap-2 shrink-0 self-center text-xs ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
        </div>
      )}

      {/* Drop zone hint when dragging */}
      {dragging && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-3xl z-20 pointer-events-none ${
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
        className={`w-full bg-transparent text-sm outline-none resize-none leading-relaxed overflow-hidden italic min-w-0 ${
          dark ? 'text-emerald-300/80' : 'text-emerald-700/80'
        }`}
        placeholder={showPlaceholder ? 'Describe the visual...' : undefined}
      />

      {/* Lightbox */}
      {lightbox && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white"
            onClick={() => setLightbox(false)}
          >
            <X size={24} />
          </button>
          <img
            src={imageUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
