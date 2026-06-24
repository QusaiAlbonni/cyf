import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudStorageService } from './dms/cloud-storage.service';
import { LocalStorageService } from './dms/local-storage/local-storage.service';

@Injectable()
export class StorageService {
  private readonly isProduction: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudStorageService: CloudStorageService,
    private readonly localStorageService: LocalStorageService,
  ) {
    this.isProduction = this.configService.get<string>('DEBUG') !== 'true';
  }

  /**
   * Retrieves the URL for accessing a file based on the provided key.
   * Delegates the request to the proper storage service.
   *
   * @param key The key/path of the file.
   * @returns The file URL as a string.
   */
  async getFileUrl(
    key?: string | null,
    host?: string,
  ): Promise<string | null | undefined> {
    if (!key) {
      return key;
    }

    if (this.isProduction) {
      const { url } = await this.cloudStorageService.getPresignedSignedUrl(key);
      return url;
    } else {
      const { url } = await this.localStorageService.getUrl(key, host);
      return url;
    }
  }

  /**
   * Uploads a file using the appropriate storage service.
   *
   * @param args An object containing the file, its visibility and optional key.
   * @returns An object with the file URL, key, and visibility.
   */
  async uploadFile(args: {
    file: Express.Multer.File;
    isPublic?: boolean;
    key?: string;
  }): Promise<{ url: string; key: string }> {
    if (this.isProduction) {
      return await this.cloudStorageService.uploadFile(args);
    } else {
      return await this.localStorageService.uploadFile(args);
    }
  }

  /**
   * Deletes a file using the appropriate storage service.
   *
   * @param key The key/path of the file to delete.
   * @returns A confirmation message.
   */
  async deleteFile(key: string): Promise<{ message: string }> {
    if (this.isProduction) {
      return await this.cloudStorageService.deleteFile(key);
    } else {
      return await this.localStorageService.deleteFile(key);
    }
  }

  async getFile(key: string) {
    if (this.isProduction) {
      return await this.cloudStorageService.getFile(key);
    } else {
      return await this.localStorageService.getFile(key);
    }
  }
}
