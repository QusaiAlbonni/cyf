import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { StorageModule } from './storage/storage.module';
import { PhoneModule } from './phone/phone.module';
import { CacheModule } from '@nestjs/cache-manager';
import { seconds, ThrottlerModule } from '@nestjs/throttler';
import { staticConfig } from './storage/static.config';
import { IsUniqueConstraint } from './shared/validation/is-unique-constraint';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { createWinstonLogger } from './logging/winston';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { getRedisThrottlerStorage } from './storage/utils';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { createKeyv } from '@keyv/redis';
import { BatchModule } from './batch/batch.module';
import { SkillModule } from './skill/skill.module';
import { SpecializationModule } from './specialization/specialization.module';
import { TaskModule } from './task/task.module';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: true, global: true }),
    CommonModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: staticConfig,
    }),
    StorageModule,
    PhoneModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: seconds(1),
            limit: 5,
          },
        ],
        storage: getRedisThrottlerStorage(config),
      }),
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return createWinstonLogger(configService);
      },
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      resolvers: [AcceptLanguageResolver],
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
      },
    }),
    ScheduleModule.forRoot(),
    BatchModule,
    SkillModule,
    SpecializationModule,
    TaskModule,
    SubmissionModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    IsUniqueConstraint,
  ],
})
export class AppModule {}
