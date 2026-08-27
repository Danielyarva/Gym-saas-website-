'use client';

import { useParams } from 'next/navigation';
import { NoteList } from '@/components/clients/profile/notes/note-list';

export default function ClientNotesPage() {
  const { id } = useParams<{ id: string }>();
  return <NoteList clientId={id} />;
}
