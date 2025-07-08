import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ description: 'Email address to send OTP to' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User type (user or owner)', enum: ['user', 'owner'] })
  @IsEnum(['user', 'owner'])
  @IsNotEmpty()
  userType: 'user' | 'owner';

  @ApiPropertyOptional({ description: 'Purpose of OTP', enum: ['email_verification', 'password_reset'], default: 'email_verification' })
  @IsEnum(['email_verification', 'password_reset'])
  @IsOptional()
  purpose?: 'email_verification' | 'password_reset';
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'OTP code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'User type (user or owner)', enum: ['user', 'owner'] })
  @IsEnum(['user', 'owner'])
  @IsNotEmpty()
  userType: 'user' | 'owner';

  @ApiPropertyOptional({ description: 'Purpose of OTP', enum: ['email_verification', 'password_reset'], default: 'email_verification' })
  @IsEnum(['email_verification', 'password_reset'])
  @IsOptional()
  purpose?: 'email_verification' | 'password_reset';
} 