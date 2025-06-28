import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Owner } from '../../entities/owner.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Owner => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
); 