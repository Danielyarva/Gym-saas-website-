import type { Request } from 'express';
import { clientNoteRepository } from '../repositories/client-note.repository';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';

function toPublicNote(note: { id: string; body: string; createdAt: Date; updatedAt: Date; coachId: string; coach: { fullName: string } }) {
  return {
    id: note.id,
    body: note.body,
    authorName: note.coach.fullName,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

async function list(clientId: string) {
  const notes = await clientNoteRepository.listForClient(clientId);
  return notes.map(toPublicNote);
}

async function create(clientId: string, coachId: string, body: string, req: Request) {
  const note = await clientNoteRepository.create(clientId, coachId, body);
  await auditService.log({ req, actorUserId: req.user?.id, action: 'CLIENT_NOTE_ADDED', entityType: 'CLIENT', entityId: clientId });
  return toPublicNote(note);
}

/**
 * `requireClientOwnership` on the route already proved the caller's coachId
 * owns `clientId`; this additionally proves the note itself both belongs to
 * that same client (not some other client of the same coach, reached by
 * swapping the :id in the URL) and was authored by the calling coach.
 */
async function assertNoteBelongsToClientAndAuthor(noteId: string, clientId: string, coachId: string) {
  const note = await clientNoteRepository.findById(noteId);
  if (!note || note.clientId !== clientId) throw new AppError('NOT_FOUND', 'Note not found');
  if (note.coachId !== coachId) throw new AppError('FORBIDDEN', 'You can only edit your own notes');
  return note;
}

async function update(noteId: string, clientId: string, coachId: string, body: string, req: Request) {
  const existing = await assertNoteBelongsToClientAndAuthor(noteId, clientId, coachId);
  const note = await clientNoteRepository.update(noteId, body);
  await auditService.log({ req, actorUserId: req.user?.id, action: 'CLIENT_NOTE_UPDATED', entityType: 'CLIENT', entityId: existing.clientId });
  return toPublicNote(note);
}

async function remove(noteId: string, clientId: string, coachId: string, req: Request) {
  const existing = await assertNoteBelongsToClientAndAuthor(noteId, clientId, coachId);
  await clientNoteRepository.delete(noteId);
  await auditService.log({ req, actorUserId: req.user?.id, action: 'CLIENT_NOTE_DELETED', entityType: 'CLIENT', entityId: existing.clientId });
}

export const notesService = {
  list,
  create,
  update,
  remove,
};
