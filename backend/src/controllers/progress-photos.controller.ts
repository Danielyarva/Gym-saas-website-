import type { Request, Response } from 'express';
import { progressPhotoService } from '../services/progress-photo.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await progressPhotoService.list(req.params.id!, page, pageSize);
  sendSuccess(res, data);
});

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const { takenAt } = req.body as { takenAt?: Date };
  const data = await progressPhotoService.upload(req.params.id!, req.file!, takenAt, req);
  sendSuccess(res, data, 'Photo uploaded', 201);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await progressPhotoService.remove(req.params.id!, req.params.photoId!, req);
  sendSuccess(res, null, 'Photo deleted');
});
