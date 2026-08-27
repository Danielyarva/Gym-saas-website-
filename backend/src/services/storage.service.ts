import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../config/logger';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const LOCAL_URL_PREFIX = '/uploads/';

const cloudinaryConfigured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadableFile {
  buffer: Buffer;
  originalname: string;
}

function uploadToCloudinary(file: UploadableFile, folder: string): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: `ai-coach-os/${folder}` }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error('Cloudinary upload returned no result'));
        return;
      }
      resolve({ url: result.secure_url });
    });
    uploadStream.end(file.buffer);
  });
}

async function saveLocally(file: UploadableFile, folder: string): Promise<{ url: string }> {
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOADS_DIR, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), file.buffer);
  return { url: `${env.BACKEND_URL}${LOCAL_URL_PREFIX}${folder}/${filename}` };
}

/**
 * Uploads to Cloudinary when credentials are configured; otherwise falls
 * back to writing the file to backend/uploads/ and serving it via the
 * static route registered in app.ts — the same "log instead of send when
 * unset" fallback email.service.ts uses for local dev, so progress photos
 * are fully testable without a real Cloudinary account.
 */
export const storageService = {
  async uploadImage(file: UploadableFile, folder: string): Promise<{ url: string }> {
    if (cloudinaryConfigured) {
      return uploadToCloudinary(file, folder);
    }
    logger.info({ folder }, 'Cloudinary credentials not set — saving upload to local disk instead');
    return saveLocally(file, folder);
  },

  /** Cloudinary URLs are left as orphans on delete (MVP tradeoff — see Phase 3 plan); local files are unlinked. */
  async deleteImage(url: string): Promise<void> {
    if (!url.includes(LOCAL_URL_PREFIX)) return;

    const relativePath = url.slice(url.indexOf(LOCAL_URL_PREFIX) + LOCAL_URL_PREFIX.length);
    try {
      await unlink(path.join(UPLOADS_DIR, relativePath));
    } catch (err) {
      logger.warn({ err, url }, 'Failed to delete local upload file');
    }
  },
};
