import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Owner } from '../../entities/owner.entity';
import { User } from '../../entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Owner | User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Type-specific decorators for better type safety when needed
export const CurrentOwner = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Owner => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Owner;
  },
);

export const CurrentAppUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
); 