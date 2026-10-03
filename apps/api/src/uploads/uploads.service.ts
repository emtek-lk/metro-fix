import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

export interface UploadedFileLike {
  buffer: Buffer;
  size: number;
  mimetype?: string;
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Where uploaded files live. Mount this as a volume in production. */
export const uploadDir = (): string => resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'));

/** The file's real type from its first bytes, so a renamed .exe cannot pass as a photo. */
function sniffImage(buffer: Buffer): 'jpg' | 'png' | 'webp' | 'heic' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') return 'heic';
  return null;
}

@Injectable()
export class UploadsService {
  /** Saves a photo and returns the path clients store (`/uploads/<id>.<ext>`), relative so it works from any host. */
  async savePhoto(file: UploadedFileLike | undefined): Promise<{ url: string; bytes: number }> {
    if (!file?.buffer?.length) throw new BadRequestException('Attach a photo to upload.');
    if (file.size > MAX_UPLOAD_BYTES) throw new BadRequestException('That photo is larger than 8 MB.');
    const kind = sniffImage(file.buffer);
    if (!kind) throw new BadRequestException('Only JPEG, PNG, WebP or HEIC photos can be uploaded.');

    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${kind}`;
    await writeFile(join(dir, name), file.buffer);
    return { url: `/uploads/${name}`, bytes: file.size };
  }
}
