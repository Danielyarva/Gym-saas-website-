import { Skeleton } from '@/components/ui/skeleton';

export default function ClientNotesLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );
}
