import { INestApplication } from '@nestjs/common';
import * as env from 'env-var';

export function addCorsPolicy(app: INestApplication) {
  const allowedOrigins = env
    .get('ALLOWED_ORIGINS')
    .required()
    .asArray(',')
    .map((o) => o.trim().replace(/\/$/, '').toLowerCase());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
}
