import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '../../drizzle/schema.js';

export const CurrentUser = createParamDecorator((data: keyof User | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: User }>();
  if (!request.user) return null;
  return data ? request.user[data] : request.user;
});
