import type { Request, Response } from 'express';
import { notesService } from '../services/notes.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await notesService.list(req.params.id!);
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await notesService.create(req.params.id!, req.user!.coachId!, req.body.body, req);
  sendSuccess(res, data, 'Note added', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await notesService.update(req.params.noteId!, req.params.id!, req.user!.coachId!, req.body.body, req);
  sendSuccess(res, data, 'Note updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await notesService.remove(req.params.noteId!, req.params.id!, req.user!.coachId!, req);
  sendSuccess(res, null, 'Note deleted');
});
