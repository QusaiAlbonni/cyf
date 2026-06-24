import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext): any => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return null;

    return data ? user[data] : user;
  },
);

