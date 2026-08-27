'use client';

import { PhotoUploadView } from '@/components/client-app/progress/photo-upload-view';
import { useMe } from '@/hooks/use-auth';

export default function ProgressPage() {
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';

  return <PhotoUploadView clientId={clientId} />;
}
