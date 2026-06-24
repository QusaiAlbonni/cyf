import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function typeOrmConfiguration(
  configService: ConfigService,
): TypeOrmModuleOptions {
  let extraOptions = {};
  if (configService.get<string>('DEBUG') === 'true') {
    extraOptions = {
      synchronize: true,
      //KEEP THIS AS TRUE.. use conosle.error if you're lost in the logs
      logging: true,
    };
  } else {
    extraOptions = {
      migrations: ['./migrations/*.ts'],
      migrationsRun: true,
    }
  }
  return {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    ...extraOptions,
  };
}
