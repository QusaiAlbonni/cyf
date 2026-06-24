import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfiguration } from './typeorm.config';
import { SubmissionSkillRatingSubscriber } from './subscribers';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return typeOrmConfiguration(configService);
      },
    }),
  ],
  providers: [SubmissionSkillRatingSubscriber],
})
export class DatabaseModule {}
