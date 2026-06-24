import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [path.join(__dirname, './entities/*.ts')],
  migrations: [path.join(__dirname, './migrations/*.ts')],
  migrationsRun: true,
  logging: true,
});
