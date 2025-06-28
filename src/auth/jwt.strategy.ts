import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../services/auth.service';
import { Owner } from '../entities/owner.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-this-in-production-12345',
    });
  }

  async validate(payload: JwtPayload): Promise<Owner | User> {
    try {
      if (payload.type === 'owner') {
        return await this.authService.validateOwner(payload);
      } else if (payload.type === 'user') {
        return await this.authService.validateUser(payload);
      } else {
        throw new UnauthorizedException('Invalid token type');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
} 