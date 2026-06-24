import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class LocalStorageService {
  private storagePath: string;
  private serveRoot: string;

  constructor(private readonly configService: ConfigService) {
    const staticPath =
      this.configService.get<string>('STATIC_PATH') || 'public';
    this.storagePath = path.join(__dirname, '../../../../', staticPath);
    this.serveRoot = this.configService.get<string>('STATIC_ROOT') || '/static';
  }

  /**
   * Uploads a file to the local storage.
   *
   * @param file The file object from Multer.
   * @param isPublic Whether the file should be publicly accessible (kept for interface consistency).
   * @param key The file key/path (defaults to a randomly generated UUID).
   * @returns An object containing the file URL, key, and visibility flag.
   */
  async uploadFile({
    file,
    key = uuidv4(),
  }: {
    file: Express.Multer.File;
    key?: string;
  }) {
    try {
      const filePath = path.join(this.storagePath, key);

      await fs.mkdir(path.dirname(filePath), { recursive: true });

      await fs.writeFile(filePath, file.buffer);

      return {
        url: (await this.getUrl(key)).url,
        key,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Constructs the URL for accessing the file.
   * Since files are served statically, this URL is simply the
   * serveRoot combined with the file key.
   *
   * @param key The file key/path.
   * @returns An object containing the URL.
   */
  async getUrl(key: string, host?: string) {
    host = host
      ? host
      : `http://localhost:${this.configService.get<string>('PORT') ?? 3000}`;
    try {
      const url = `${host}${this.serveRoot}/${key}`;
      return { url };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Deletes a file from the local storage.
   *
   * @param key The file key/path.
   * @returns A confirmation message.
   */
  async deleteFile(key: string) {
    try {
      const filePath = path.join(this.storagePath, key);
      await fs.unlink(filePath);
      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getFile(key: string) {
    try {
      const filePath = path.join(this.storagePath, key);
      return await fs.readFile(filePath);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
