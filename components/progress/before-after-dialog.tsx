'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import type { ProgressPhoto } from '@/types';

interface BeforeAfterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  before: ProgressPhoto;
  after: ProgressPhoto;
}

export function BeforeAfterDialog({ open, onOpenChange, before, after }: BeforeAfterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Before / after</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {[before, after].map((photo, index) => (
            <div key={photo.id} className="space-y-2">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{index === 0 ? 'Before' : 'After'}</p>
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-secondary">
                <Image src={photo.url} alt={`Progress photo from ${formatDate(photo.takenAt)}`} fill className="object-cover" unoptimized />
              </div>
              <p className="text-center text-xs text-muted-foreground">{formatDate(photo.takenAt)}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
