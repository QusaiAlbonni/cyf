import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token, User } from '../database/entities';
import { TokenService } from './services/token.service';
import { OpaqueStrategy } from './strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PhoneModule } from '../phone/phone.module';
import { StorageModule } from '../storage/storage.module';
import { OptionalOpaqueStrategy } from './strategy/opaque-optional.strategy';
import { TokensCleanupService } from './tasks/clear-expired-tokens.task';
import { AuthEventEmitter } from './events/emitters/auth.event-emitter';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Token]),
    PassportModule.register({ defaultStrategy: 'opaque' }),
    forwardRef(() => UsersModule),
    PhoneModule,
    StorageModule,
  ],
  exports: [TokenService, AuthService],
  providers: [
    AuthService,
    TokenService,
    OpaqueStrategy,
    OptionalOpaqueStrategy,
    AuthEventEmitter,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
