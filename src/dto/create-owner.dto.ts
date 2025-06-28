import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';

export class CreateOwnerDto {
  @ApiProperty({ description: 'Owner name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Owner phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Owner email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Owner password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateOwnerDto extends PartialType(OmitType(CreateOwnerDto, ['password'] as const)) {
  @ApiProperty({ description: 'Owner name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Owner phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Owner email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
} 