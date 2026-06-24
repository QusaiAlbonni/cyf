import { Token } from '@/database/entities';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class TokensCleanupService {
  constructor(
    @InjectRepository(Token) private readonly repo: Repository<Token>,
  ) {}

  @Cron('0 * * * *')
  async cleanupExpiredTokens() {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
