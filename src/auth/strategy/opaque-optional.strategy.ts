import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from '../services/auth.service';
import { User } from '@/database/entities';

@Injectable()
export class OptionalOpaqueStrategy extends PassportStrategy(
  Strategy,
  'optional-opaque',
) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(token: string | undefined): Promise<User | null> {
    if (!token) return null;
    return await this.authService.authenticateToken(token);
  }
}
