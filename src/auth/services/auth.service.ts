import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { Role, Token, User } from '../../database/entities';
import { UsersService } from '../../users/users.service';
import * as argon from 'argon2';
import { LoginDto } from '../dto/login.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../../users/dto';
import { ConfigService } from '@nestjs/config';
import { SetPasswordDto } from '../dto';
import { AuthenticatedUserResponseDto } from '../dto/authenticated-user.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { StorageService } from '../../storage/storage.service';
import { InvalidDeviceException } from '../exceptions/invalid-device.exception';
import { TOKEN_EXPIRATION_TIME } from '../constants/token-expiration';
import { AuthEventEmitter } from '../events/emitters/auth.event-emitter';
import { AuthEventType } from '../events/models/auth.events';

@Injectable()
export class AuthService {
  private otpTtl: number;
  static otpLength: number = 6;

  constructor(
    private tokenService: TokenService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
    configService: ConfigService,
    private storageService: StorageService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly eventEmitter: AuthEventEmitter,
  ) {
    this.otpTtl = parseInt(configService.get<string>('OTP_TTL') || '50000');
  }

  async authenticateToken(token: string): Promise<User | null> {
    const tokenRecord = await this.tokenService.findToken(token);
    if (!tokenRecord || tokenRecord.revoked) {
      return null;
    }

    if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
      return null;
    }

    const user = tokenRecord.user;
    if (!user) {
      return null;
    }

    user.isAuthenticated = true;
    user.currentToken = tokenRecord;

    return user;
  }

  async logout(user: User) {
    this.logger.info({
      message: 'user logged out',
      userId: user.id,
    });
    await this.tokenService.deleteToken(user.currentToken);
  }

  async validateSingleDevice(user: User, deviceId: string) {
    if (!user.isCustomerUser) return;
    const lastToken = await this.tokenService.findLast(user.id);
    if (!lastToken) return;
    const now = new Date();
    if (
      lastToken.deviceId !== deviceId &&
      lastToken.expiresAt &&
      !lastToken.revoked &&
      lastToken.expiresAt >= now
    ) {
      throw new InvalidDeviceException();
    }
  }

  async login(dto: LoginDto): Promise<AuthenticatedUserResponseDto> {
    const user = await this.userService.findByUsername(dto.username);

    const e = new BadRequestException(['كلمة المرور او المستخدم غير صحيحين']);

    if (!user || !user.password) {
      if (user) {
        this.logger.info({
          message: 'failed user attempt to login',
          error: 'incorrect username',
          username: dto.username,
        });
      }
      throw e;
    }

    if (!dto.deviceId && user.isCustomerUser) throw e;

    if (dto.deviceId) {
      try {
        await this.validateSingleDevice(user, dto.deviceId);
      } catch (error) {
        if (error instanceof InvalidDeviceException) {
          this.logger.info({
            message: 'User tried to login with a different device',
            error: error,
            phone: user.phone,
          });
          throw new HttpException(
            'لم يتم التعرف على جهازك, تواصل مع خدمة العملاء',
            472,
          );
        }
        throw error;
      }
    }

    const passowrdMatches = await this.verifyPassword(
      dto.password,
      user.password,
    );

    if (!passowrdMatches) {
      this.logger.info({
        message: 'failed user attempt to login',
        error: 'incorrect password',
        userId: user.id,
      });
      throw e;
    }

    if (user.isCustomerUser) await this.tokenService.deleteAllTokens(user);

    let expiration: 'default' | undefined | number = undefined;
    if (user.isCustomerUser) expiration = 'default';
    const { token } = await this.storeOpaqueToken(
      user.id,
      expiration,
      dto.deviceId ?? null,
    );

    return {
      access_token: token,
      user: plainToInstance(UserResponseDto, user),
    };
  }
  /**
   *
   * @param phone phone number
   * @param password password
   * @returns
   */
  async authenticateAdminJS(phone: string, password: string) {
    const dto = new LoginDto();
    dto.username = phone;
    dto.password = password;
    const user = await this.userService.findByUsername(dto.username);

    if (!user || !user.password || user.role !== Role.ADMIN) {
      return null;
    }

    const passowrdMatches = await this.verifyPassword(
      dto.password,
      user.password,
    );

    if (!passowrdMatches) {
      return null;
    }

    const adminJSUser = {
      id: user.id.toString(),
      email: user.username,
      title: user.fullName ?? undefined,
      avatarUrl:
        (await this.storageService.getFileUrl(user.profilePicture)) ??
        undefined,
    };

    return adminJSUser;
  }

  async storeOpaqueToken(
    userId: number,
    expirationOffset?: number | null | 'default',
    deviceId: string | null = null,
  ): Promise<Token> {
    const tokenString = this.tokenService.generateOpaqueToken();

    let expiresAt: Date | null = null;
    if (expirationOffset) {
      const now = new Date();
      let offset = TOKEN_EXPIRATION_TIME;
      if (!(expirationOffset === 'default')) offset = expirationOffset;
      expiresAt = new Date(now.getTime() + offset);
    }
    const token = await this.tokenService.createToken(
      userId,
      tokenString,
      'opaque',
      expiresAt,
      deviceId,
    );
    return token;
  }

  async setPassword(user: User, dto: SetPasswordDto) {
    if (
      !user.password ||
      !(await this.verifyPassword(dto.oldPassword, user.password))
    ) {
      this.logger.warn({
        message: 'user attempted to set password',
        error: 'incorrect password',
        userId: user.id,
      });
      throw new UnauthorizedException(['كلمة المرور غير صحيحة']);
    }
    const hash = await this.hashPassword(dto.newPassword);

    await this.userService.changePassword(hash, user);
  }

  async hashPassword(password: string): Promise<string> {
    return argon.hash(password);
  }
  async verifyPassword(candidate: string, hash: string): Promise<boolean> {
    return argon.verify(hash, candidate);
  }

  async resetSessions(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException();
    const result = await this.tokenService.deleteAllTokens(user);
    void this.eventEmitter.emit(AuthEventType.USER_SESSIONS_CLEARED, {
      userId,
    });
    return result;
  }
}
