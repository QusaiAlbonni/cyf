import { AuthGuard } from '@nestjs/passport';

export class OpaqueAuthGuard extends AuthGuard('opaque') {}
