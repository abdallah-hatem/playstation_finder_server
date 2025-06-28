import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OwnerOnlyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = this.jwtService.decode(token) as any;
      
      if (!payload || payload.type !== 'owner') {
        throw new ForbiddenException('Owner access required - only shop owners can access this resource');
      }

      return true;
    } catch (error) {
      throw new ForbiddenException('Invalid token or owner access required');
    }
  }
} 