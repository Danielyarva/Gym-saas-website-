import type { Request } from 'express';
import { progressPhotoRepository } from '../repositories/progress-photo.repository';
import { storageService } from './storage.service';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';
import { todayDateOnly, dateOnly } from '../utils/date';

async function list(clientId: string, page: number, pageSize: number) {
  const [items, total] = await progressPhotoRepository.list(clientId, page, pageSize);
  return { items, total, page, pageSize };
}

async function upload(clientId: string, file: Express.Multer.File, takenAt: Date | undefined, req: Request) {
  const { url } = await storageService.uploadImage({ buffer: file.buffer, originalname: file.originalname }, clientId);
  const photo = await progressPhotoRepository.create(clientId, { url, takenAt: takenAt ? dateOnly(takenAt) : todayDateOnly() });

  await auditService.log({
    req,
    actorUserId: req.user?.id,
    action: 'PROGRESS_PHOTO_UPLOADED',
    entityType: 'CLIENT',
    entityId: clientId,
    metadata: { photoId: photo.id },
  });

  return photo;
}

/** Verifies the photo belongs to this client (the ownership-chain check every nested resource in this app uses) before deleting. */
async function remove(clientId: string, photoId: string, req: Request) {
  const photo = await progressPhotoRepository.findById(photoId);
  if (!photo || photo.clientId !== clientId) {
    throw new AppError('NOT_FOUND', 'Photo not found');
  }

  await progressPhotoRepository.delete(photoId);
  await storageService.deleteImage(photo.url);

  await auditService.log({
    req,
    actorUserId: req.user?.id,
    action: 'PROGRESS_PHOTO_DELETED',
    entityType: 'CLIENT',
    entityId: clientId,
    metadata: { photoId },
  });
}

export const progressPhotoService = {
  list,
  upload,
  remove,
};
