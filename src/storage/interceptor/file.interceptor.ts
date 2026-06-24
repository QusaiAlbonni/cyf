import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  mixin,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudStorageService } from '../dms/cloud-storage.service';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { getDiskStorage, getS3Storage } from '../file-backends';

export function DynamicFileInterceptor(
  fieldName: string,
  pathName: string = '',
  options?: MulterOptions,
  multiple = false,
  maxCount = 5,
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private storage: any;
    private interceptor: NestInterceptor<any, any>;

    constructor(
      configService: ConfigService,
      storageService: CloudStorageService,
    ) {
      const storageDriver = configService.get<string>('STORAGE_DRIVER');
      const isLocalStorage =
        storageDriver === 'local' || configService.get('DEBUG') === 'true';

      if (!isLocalStorage) {
        const s3 = storageService.client;
        const bucketName = storageService.bucketName;

        this.storage = getS3Storage(s3, bucketName, pathName);
      } else {
        this.storage = getDiskStorage(
          configService.get<string>('STATIC_PATH') as string,
          pathName,
        );
      }

      // Conditionally choose the interceptor based on the 'multiple' flag
      if (multiple) {
        this.interceptor = new (FilesInterceptor(fieldName, maxCount, {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          storage: this.storage,
          ...options,
        }))();
      } else {
        this.interceptor = new (FileInterceptor(fieldName, {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          storage: this.storage,
          ...options,
        }))();
      }
    }

    intercept(context: ExecutionContext, next: CallHandler) {
      return this.interceptor.intercept(context, next);
    }
  }
  return mixin(MixinInterceptor);
}
