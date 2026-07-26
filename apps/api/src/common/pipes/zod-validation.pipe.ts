import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const parseResult = this.schema.safeParse(value);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }
    return parseResult.data;
  }
}
