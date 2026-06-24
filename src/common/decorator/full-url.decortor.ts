import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const FullUrl = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return `${request.protocol}://${request.get('host')}${request.path}`;
});