'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Images, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { BeforeAfterDialog } from './before-after-dialog';
import { useProgressPhotos } from '@/hooks/use-progress-photos';

export function PhotoGallery({ clientId }: { clientId: string }) {
  const { data, isPending } = useProgressPhotos(clientId);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const photos = data?.items ?? [];
  const selectedPhotos = photos.filter((photo) => selectedIds.includes(photo.id));

  function toggleSelect(photoId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId);
      if (prev.length >= 2) return [prev[1]!, photoId];
      return [...prev, photoId];
    });
  }

  function exitCompareMode() {
    setCompareMode(false);
    setSelectedIds([]);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">Progress photos</CardTitle>
        {photos.length >= 2 ? (
          <Button variant="outline" size="sm" onClick={() => (compareMode ? exitCompareMode() : setCompareMode(true))}>
            <GitCompareArrows /> {compareMode ? 'Cancel' : 'Compare'}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <EmptyState icon={Images} title="No photos yet" description="Photos the client uploads will appear here." />
        ) : (
          <>
            {compareMode ? <p className="mb-2 text-xs text-muted-foreground">Select two photos to compare ({selectedIds.length}/2)</p> : null}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => compareMode && toggleSelect(photo.id)}
                  className={cn(
                    'relative aspect-[3/4] overflow-hidden rounded-lg border bg-secondary',
                    compareMode ? 'cursor-pointer' : 'cursor-default',
                    selectedIds.includes(photo.id) ? 'border-primary ring-2 ring-primary' : 'border-border',
                  )}
                >
                  <Image src={photo.url} alt={`Progress photo from ${formatDate(photo.takenAt)}`} fill className="object-cover" unoptimized />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[10px] text-white">{formatDate(photo.takenAt)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {selectedPhotos.length === 2 ? (
        <BeforeAfterDialog
          open
          onOpenChange={(open) => !open && exitCompareMode()}
          before={selectedPhotos[0]!.takenAt <= selectedPhotos[1]!.takenAt ? selectedPhotos[0]! : selectedPhotos[1]!}
          after={selectedPhotos[0]!.takenAt <= selectedPhotos[1]!.takenAt ? selectedPhotos[1]! : selectedPhotos[0]!}
        />
      ) : null}
    </Card>
  );
}
