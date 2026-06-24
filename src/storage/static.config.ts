import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const staticConfig = async (configService: ConfigService) => [
  {
    rootPath: join(
      __dirname,
      '../../',
      configService.get<string>('STATIC_PATH') || 'public',
    ),
    serveRoot: configService.get<string>('STATIC_ROOT') || '/static',
  },
];
