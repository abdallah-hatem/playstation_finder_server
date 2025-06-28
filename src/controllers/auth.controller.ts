import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginOwnerDto } from '../dto/login-owner.dto';
import { RegisterOwnerDto } from '../dto/register-owner.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Owner } from '../entities/owner.entity';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Owner login' })
  @ApiResponseSuccess({ message: 'Login successful' })
  login(@Body() loginOwnerDto: LoginOwnerDto) {
    return this.authService.login(loginOwnerDto);
  }

  @Post('register/owner')
  @Public()
  @ApiOperation({ summary: 'Register new owner' })
  @ApiResponseSuccess({ message: 'Owner registered successfully' })
  registerOwner(@Body() registerOwnerDto: RegisterOwnerDto) {
    return this.authService.registerOwner(registerOwnerDto);
  }

  @Post('register/user')
  @Public()
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponseSuccess({ message: 'User registered successfully' })
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponseSuccess({ message: 'Token refreshed successfully' })
  refresh(@CurrentUser() owner: Owner) {
    return this.authService.refreshToken(owner.id);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current owner profile' })
  @ApiResponseSuccess({ message: 'Profile retrieved successfully' })
  getProfile(@CurrentUser() owner: Owner) {
    const { passwordHash, ...profile } = owner;
    return profile;
  }
} 