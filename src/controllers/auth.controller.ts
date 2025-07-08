import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { LoginOwnerDto } from '../dto/login-owner.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterOwnerDto } from '../dto/register-owner.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { SendOtpDto, VerifyOtpDto } from '../dto/send-otp.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentOwner } from '../common/decorators/current-user.decorator';
import { Owner } from '../entities/owner.entity';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Owner login' })
  @ApiResponseSuccess({ message: 'Login successful' })
  login(@Body() loginOwnerDto: LoginOwnerDto) {
    return this.authService.login(loginOwnerDto);
  }

  @Post('login/user')
  @Public()
  @ApiOperation({ summary: 'User login' })
  @ApiResponseSuccess({ message: 'User login successful' })
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto.email, loginUserDto.password);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register new owner' })
  @ApiResponseSuccess({ message: 'Owner registered successfully' })
  register(@Body() registerOwnerDto: RegisterOwnerDto) {
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponseSuccess({ message: 'Token refreshed successfully' })
  refresh(@CurrentOwner() owner: Owner) {
    return this.authService.refreshToken(owner.id);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current owner profile' })
  @ApiResponseSuccess({ message: 'Profile retrieved successfully' })
  getProfile(@CurrentOwner() owner: Owner) {
    if (!owner) {
      throw new UnauthorizedException('User not authenticated');
    }
    const { passwordHash, ...profile } = owner;
    return profile;
  }

  @Post('send-otp')
  @Public()
  @ApiOperation({ summary: 'Send OTP for email verification' })
  @ApiResponseSuccess({ message: 'OTP sent successfully' })
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.otpService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @Public()
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponseSuccess({ message: 'OTP verified successfully' })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp')
  @Public()
  @ApiOperation({ summary: 'Resend OTP for email verification' })
  @ApiResponseSuccess({ message: 'OTP resent successfully' })
  resendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.otpService.sendOtp(sendOtpDto);
  }
} 