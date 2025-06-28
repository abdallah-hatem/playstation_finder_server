import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginOwnerDto {
  @ApiProperty({ description: 'Owner email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Owner password' })
  @IsNotEmpty()
  @IsString()
  password: string;
} 