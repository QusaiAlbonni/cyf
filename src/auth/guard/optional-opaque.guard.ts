import { User } from '@/database/entities';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class OptionalOpaqueAuthGuard extends AuthGuard('optional-opaque') {
  handleRequest<TUser = User | null>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err) throw err;

    return user;
  }
}
