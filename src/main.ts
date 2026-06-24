import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import helmet from 'helmet';
import compression from 'compression';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { buildSwaggerDocument } from './swagger';
import bodyParser from 'body-parser';
import { addCorsPolicy } from './cors';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  );
  addCorsPolicy(app);
  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  if (process.env.DEBUG === 'true') {
    buildSwaggerDocument(app);
  }
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
