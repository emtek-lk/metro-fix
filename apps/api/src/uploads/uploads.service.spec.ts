import { BadRequestException } from '@nestjs/common';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { MAX_UPLOAD_BYTES, UploadsService } from './uploads.service';

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 1)]);
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 2)]);

describe('UploadsService', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'metrofix-up-'));
    process.env.UPLOAD_DIR = dir;
  });
  afterEach(async () => {
    delete process.env.UPLOAD_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it('stores a photo under a random name and returns a relative path', async () => {
    const result = await new UploadsService().savePhoto({ buffer: jpeg, size: jpeg.length });
    expect(result.url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.jpg$/);
    expect(await readFile(join(dir, result.url.replace('/uploads/', '')))).toEqual(jpeg);
  });

  it('recognises a PNG by content, whatever the client claims', async () => {
    const result = await new UploadsService().savePhoto({ buffer: png, size: png.length, mimetype: 'application/pdf' });
    expect(result.url.endsWith('.png')).toBe(true);
  });

  it('refuses non-images, empty uploads and oversized files', async () => {
    const service = new UploadsService();
    const exe = Buffer.from('MZ'.padEnd(40, 'x'));
    await expect(service.savePhoto({ buffer: exe, size: exe.length })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.savePhoto(undefined)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.savePhoto({ buffer: jpeg, size: MAX_UPLOAD_BYTES + 1 })).rejects.toThrow('8 MB');
  });
});
