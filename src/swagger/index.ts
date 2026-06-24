import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';

export function buildSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Code Your Future Platform API')
    .setDescription(
      'Backend API for batches, students, companies, tasks, submissions, reviews, and skill ratings.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Bearer',
        in: 'header',
      },
      'Bearer',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.use('api-json', (_req: Request, res: Response) => {
    res.json(documentFactory());
  });
}

export * from './decorator';
