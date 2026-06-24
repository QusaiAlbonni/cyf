import { Inject, Injectable } from '@nestjs/common';
import { Token, User } from '../../database/entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token) private tokenRepository: Repository<Token>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async deleteToken(currentToken: Token | null) {
    if (!currentToken) return;
    await this.tokenRepository.delete({ id: currentToken.id });
  }
  async deleteAllTokens(user: User | null) {
    if (!user) return;
    await this.tokenRepository.delete({ user: { id: user.id } });
    this.logger.warn({
      message: 'user logged out of all sessions',
      userId: user.id,
    });
  }

  async createToken(
    userId: number,
    token: string,
    type: string,
    expiresAt: Date | null,
    deviceId: string | null,
  ): Promise<Token> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');

    const newToken = this.tokenRepository.create({
      user,
      token,
      type,
      expiresAt,
      deviceId,
    });

    return this.tokenRepository.save(newToken);
  }

  generateOpaqueToken(size: number = 32) {
    return crypto.randomBytes(size).toString('hex');
  }

  async findFirst(userId: number, type?: string): Promise<Token | null> {
    return this.tokenRepository.findOne({
      where: { user: { id: userId }, type },
    });
  }

  async findLast(userId: number, type?: string) {
    return await this.tokenRepository.findOne({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });
  }

  async findToken(token: string): Promise<Token | null> {
    return await this.tokenRepository
      .createQueryBuilder('token')
      .leftJoinAndSelect('token.user', 'user')
      .where('token.token = :token', { token })
      .getOne();
  }
}
