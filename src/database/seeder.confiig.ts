import { ConfigService } from '@nestjs/config';
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { config } from 'dotenv';
import * as path from 'path';


config();
const configService = new ConfigService();
export const seederConfig: PostgresConnectionOptions = {
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [path.join(__dirname, './entities/*.ts')],
  synchronize:true,
}