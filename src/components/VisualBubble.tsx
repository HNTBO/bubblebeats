import { useRef, useLayoutEffect, useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { X, ImagePlus } from 'lucide-react';
import { PopOverlay } from './PopOverlay';
import { NeedleIcon } from './NeedleIcon';

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
      className={`relative group rounded-3xl border p-4 h-full flex gap-3 border-stroke-visual bg-surface-visual ${dragging ? 'ring-2 ring-accent' : ''}`}
      onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); }}
      onDragLeave={() => { dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); } }}
      onDrop={(e) => { dragCounter.current = 0; handleDrop(e); }}
    >
      {/* Needle — top right corner, hover zone */}
      <div className="absolute -top-3 -right-3 w-10 h-10 z-20 group/needle">
        <button
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/needle:opacity-100 transition-opacity text-accent hover:text-accent-soft"
          onClick={(e) => { e.stopPropagation(); setShowPop(true); }}
        >
          <NeedleIcon size={14} />
        </button>
      </div>

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
            className="rounded-2xl object-contain cursor-pointer max-h-20 max-w-24 ring-1 ring-stroke-visual"
            onClick={() => setLightbox(true)}
          />
          <button
            className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity bg-surface-overlay text-danger hover:text-danger shadow-sm"
            onClick={handleRemoveImage}
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Upload indicator */}
      {uploading && (
        <div className="flex items-center gap-2 shrink-0 self-center text-xs text-accent">
          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
        </div>
      )}

      {/* Drop zone hint when dragging */}
      {dragging && (
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl z-20 pointer-events-none bg-surface-visual">
          <div className="flex items-center gap-2 text-sm text-accent-soft">
            <ImagePlus size={18} />
            Drop image here
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none resize-none leading-relaxed overflow-hidden italic min-w-0 text-text-visual"
        style={{ fontFamily: "'SN Pro', sans-serif", fontWeight: 300 }}
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
