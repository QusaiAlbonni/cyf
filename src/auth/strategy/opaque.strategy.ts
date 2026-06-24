import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from '../services/auth.service';

@Injectable()
export class OpaqueStrategy extends PassportStrategy(Strategy, 'opaque') {
  constructor(private readonly authService: AuthService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  async validate(token: string): Promise<any> {
    const user = await this.authService.authenticateToken(token);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
