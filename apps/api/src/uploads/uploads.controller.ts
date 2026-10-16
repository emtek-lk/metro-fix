import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@metro-fix/core-types';
import { Roles } from '../auth/roles.decorator';
import { MAX_UPLOAD_BYTES, UploadsService, type UploadedFileLike } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** A job photo (multipart field `file`). Workers attach the returned path to their proof. */
  @Roles(Role.WORKER, Role.ADMIN, Role.CUSTOMER_CARE)
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async upload(@UploadedFile() file: UploadedFileLike | undefined) {
    return this.uploads.savePhoto(file);
  }
}
