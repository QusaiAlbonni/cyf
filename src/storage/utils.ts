import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import pdf from 'pdf-parse';

export function imageFileFilter(allowedTypes?: string[]) {
  return (
    req: Request,
    file: Express.Multer.File | Express.MulterS3.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    const finalAllowedTypes = allowedTypes || allowedMimeTypes;

    if (!finalAllowedTypes.includes(file.mimetype) || !file) {
      return callback(
        new UnsupportedMediaTypeException(
          `Invalid file type. Allowed: ${finalAllowedTypes.join(', ')}`,
        ),
        false,
      );
    }

    callback(null, true);
  };
}

export function pdfFileFilter() {
  return (
    req: Request,
    file: Express.Multer.File | Express.MulterS3.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['application/pdf'];

    if (!allowedMimeTypes.includes(file.mimetype) || !file) {
      return callback(
        new UnsupportedMediaTypeException(
          `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
        ),
        false,
      );
    }

    callback(null, true);
  };
}

export function getRedisThrottlerStorage(configService: ConfigService) {
  return new ThrottlerStorageRedisService(
    new Redis(configService.get<string>('REDIS_URL') || '', {
      keyPrefix: 'throttle:',
    }),
  );
}

export async function getPdfPageCount(buffer: Buffer){
  const data = await pdf(buffer);
  return data.numpages;
}
