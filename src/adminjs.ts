import { BaseEntity } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/services/auth.service';
import { UsersModule } from './users/users.module';
import { isClassExtending } from './common/utils';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisStore } from 'connect-redis';
import * as entitiesModule from '@/database/entities'

export async function setupAdminJS() {
  const AdminJSTypeorm = await import('@adminjs/typeorm');
  const { AdminJS } = await import('adminjs');

  AdminJS.registerAdapter({
    Resource: AdminJSTypeorm.Resource,
    Database: AdminJSTypeorm.Database,
  });

  const entities: Function[] = [];

  Object.entries(entitiesModule).forEach(([name, exported]) => {
    if (
      typeof exported === 'function' &&
      isClassExtending(exported, BaseEntity)
    ) {
      entities.push(exported);
    }
  });
  return import('@adminjs/nestjs').then(({ AdminModule }) => {
    return AdminModule.createAdminAsync({
      imports: [AuthModule, UsersModule, ConfigModule],
      inject: [AuthService, ConfigService],
      useFactory: (authService: AuthService, configService: ConfigService) => {
        const redisURL = configService.get<string>('REDIS_URL') || '';
        const redisClient = new Redis(redisURL, {
          keyPrefix: 'session-adminjs:',
        });
        const redisStore = new RedisStore({ client: redisClient });
        const authenticate = async (email: string, password: string) => {
          return await authService.authenticateAdminJS(email, password);
        };
        return {
          adminJsOptions: {
            rootPath: '/admin',
            resources: entities,
            branding: {
              companyName: 'SuperMarket',
            },
          },
          auth: {
            authenticate: authenticate,
            cookieName: 'adminjs',
            cookiePassword: 'secret',
          },
          sessionOptions: {
            store: redisStore,
            resave: true,
            saveUninitialized: true,
            secret: 'secret',
          },
        };
      },
    });
  });
}
