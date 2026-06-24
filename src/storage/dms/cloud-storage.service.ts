import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const EXPIRATION_TIME: number = 60 * 60 * 10;

@Injectable()
export class CloudStorageService {
  public client: S3Client;
  public bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const s3Region = this.configService.get<string>('S3_REGION');
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || '';

    this.client = new S3Client({
      region: s3Region,
      endpoint: configService.get<string>('S3_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: configService.get<string>('S3_ACCESS_KEY') as string,
        secretAccessKey: configService.get<string>(
          'S3_SECRET_ACCESS_KEY',
        ) as string,
      },
    });
  }

  async uploadFile({
    file,
    isPublic = true,
    key = uuidv4(),
  }: {
    file: Express.Multer.File;
    isPublic?: boolean;
    key?: string;
  }) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: isPublic ? 'public-read' : 'private',

        Metadata: {
          originalName: file.originalname,
        },
      });

      await this.client.send(command);

      return {
        url: (await this.getPresignedSignedUrl(key)).url,
        key,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getPresignedSignedUrl(key: string) {
    try {      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: "inline",
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: EXPIRATION_TIME, 
      });

      return { url };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);

      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  async getFile(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `${key}`,
      });

      const { Body } = await this.client.send(command);

      if (Body instanceof Readable) {
        console.log('s')
        const chunks: Buffer[] = [];
        for await (const chunk of Body) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      }

      return Body;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
