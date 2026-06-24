// rekognition.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
  DetectModerationLabelsCommandInput,
} from '@aws-sdk/client-rekognition';

export type ImageSource = Express.Multer.File | { bucket: string; key: string };

@Injectable()
export class RekognitionService {
  private rekognitionClient: RekognitionClient;

  constructor(private configService: ConfigService) {
    this.rekognitionClient = new RekognitionClient({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Detect inappropriate content in an image.
   * Accepts either an in-memory Multer file or an S3 object.
   * @param source Multer file or S3 object
   * @param minConfidence Minimum confidence threshold (0-100)
   * @returns Detection results
   */
  async detectInappropriateContent(
    source: ImageSource,
    minConfidence = 70,
  ): Promise<{
    isInappropriate: boolean;
    labels: Array<{ name: string | undefined; confidence: number | undefined }>;
  }> {
    try {
      const params: DetectModerationLabelsCommandInput = {
        Image: {},
        MinConfidence: minConfidence,
      };
      if (params.Image) {
        if ('buffer' in source) {
          params.Image.Bytes = source.buffer;
        } else if ('bucket' in source && 'key' in source) {
          params.Image.S3Object = {
            Bucket: source.bucket,
            Name: `${source.bucket}/${source.key}`,
          };
        } else {
          throw new Error('Invalid image source');
        }
      }
      const command = new DetectModerationLabelsCommand(params);
      const response = await this.rekognitionClient.send(command);

      const labels = (response.ModerationLabels || []).map((label) => ({
        name: label.Name,
        confidence: label.Confidence,
      }));

      return {
        isInappropriate: labels.length > 0,
        labels,
      };
    } catch (error) {
      throw new Error(
        `Rekognition failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
