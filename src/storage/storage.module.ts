import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { FileUrlInterceptor } from './interceptor/file-url.interceptor';
import { CloudStorageService } from './dms/cloud-storage.service';
import { LocalStorageService } from './dms/local-storage/local-storage.service';
import { RekognitionService } from './rekognition/rekognition.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getStorage } from './file-backends';

@Global()
@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule, StorageModule],
      inject: [ConfigService, CloudStorageService],
      useFactory: getStorage,
    }),
  ],
  providers: [
    StorageService,
    {
      provide: APP_INTERCEPTOR,
      useClass: FileUrlInterceptor,
    },
    CloudStorageService,
    LocalStorageService,
    RekognitionService,
  ],
  exports: [
    StorageService,
    CloudStorageService,
    LocalStorageService,
    RekognitionService,
    MulterModule.registerAsync({
      imports: [ConfigModule, StorageModule],
      inject: [ConfigService, CloudStorageService],
      useFactory: getStorage,
    }),
  ],
})
export class StorageModule {}
