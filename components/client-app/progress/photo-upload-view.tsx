'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Camera, Images, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/format';
import { useProgressPhotos, useUploadProgressPhoto, useDeleteProgressPhoto } from '@/hooks/use-progress-photos';
import { ApiError } from '@/services/api-client';

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PhotoUploadView({ clientId }: { clientId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const { data, isPending } = useProgressPhotos(clientId);
  const uploadPhoto = useUploadProgressPhoto(clientId);
  const deletePhoto = useDeleteProgressPhoto(clientId);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function resetSelection() {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleUpload() {
    if (!previewFile) return;
    uploadPhoto.mutate(
      { file: previewFile, takenAt: todayInputValue() },
      {
        onSuccess: () => {
          toast.success('Photo uploaded');
          resetSelection();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  }

  const photos = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress</p>
        <h1 className="text-lg font-semibold text-foreground">Your transformation photos</h1>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

      {previewUrl ? (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-lg bg-secondary">
            <Image src={previewUrl} alt="Selected photo preview" fill className="object-cover" unoptimized />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetSelection} disabled={uploadPhoto.isPending}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleUpload} disabled={uploadPhoto.isPending}>
              {uploadPhoto.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
          <Camera /> Add a photo
        </Button>
      )}

      {isPending ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState icon={Images} title="No photos yet" description="Add your first progress photo to start a visual record." />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-secondary">
              <Image src={photo.url} alt={`Progress photo from ${formatDate(photo.takenAt)}`} fill className="object-cover" unoptimized />
              <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[10px] text-white">{formatDate(photo.takenAt)}</span>
              <button
                type="button"
                onClick={() => setDeletingPhotoId(photo.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                aria-label="Delete photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingPhotoId)}
        onOpenChange={(open) => !open && setDeletingPhotoId(null)}
        title="Delete this photo?"
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        isPending={deletePhoto.isPending}
        onConfirm={() => {
          if (!deletingPhotoId) return;
          deletePhoto.mutate(deletingPhotoId, {
            onSuccess: () => {
              toast.success('Photo deleted');
              setDeletingPhotoId(null);
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
          });
        }}
      />
    </div>
  );
}
