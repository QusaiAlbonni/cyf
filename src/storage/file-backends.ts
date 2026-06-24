import { randomUUID } from 'crypto';
import { diskStorage, StorageEngine } from 'multer';
import { join, extname } from 'path';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { existsSync, mkdirSync } from 'fs';
import { StoredFile } from './types/file';
import { ConfigService } from '@nestjs/config';
import { CloudStorageService } from './dms/cloud-storage.service';
import { MulterModuleOptions } from '@nestjs/platform-express';

function getOrCreatePath(path: string) {
  const uploadDir = path;
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

export function getDiskStorage(staticPath: string, pathName: string) {
  return diskStorage({
    destination: (req, file, cb) => {
      const path = join('./', staticPath, pathName);
      getOrCreatePath(path);
      cb(null, path);
    },
    filename: (req, file: StoredFile, cb) => {
      console.log(file);
      const extension = extname(file.originalname);
      const baseName = file.originalname
        .replace(/\s/g, '')
        .replace(extension, '');
      const fileName = `${Date.now()}-${baseName}-${randomUUID()}${extension}`;
      file.storageKey = `${pathName}/${fileName}`;
      cb(null, fileName);
    },
  });
}

export function getS3Storage(
  s3: S3Client,
  bucketName: string,
  pathName: string,
) {
  return multerS3({
    s3,
    bucket: bucketName,
    acl: 'private',
    key: (req, file: StoredFile, cb) => {
      const extension = extname(file.originalname);
      const baseName = file.originalname
        .replace(/\s/g, '')
        .replace(extension, '');
      const fileName = `${Date.now()}-${baseName}-${randomUUID()}${extension}`;
      file.storageKey = `${pathName}/${fileName}`;
      cb(null, file.storageKey);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  });
}

export function getStorage(
  configService: ConfigService,
  storageService: CloudStorageService,
): MulterModuleOptions {
  const storageDriver = configService.get<string>('STORAGE_DRIVER');
  const isLocalStorage =
    storageDriver === 'local' || configService.get('DEBUG') === 'true';
  let storage: StorageEngine;

  if (!isLocalStorage) {
    const s3 = storageService.client;
    const bucketName = storageService.bucketName;

    storage = getS3Storage(s3, bucketName, 'uploads');
  } else {
    storage = getDiskStorage(
      configService.get<string>('STATIC_PATH') as string,
      'uploads',
    );
  }
  return { storage };
}
