import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShopDto {
  // ownerId will be automatically set from JWT token

  @ApiProperty({ description: 'Shop name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Shop address' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsString()
  lat: string;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsString()
  long: string;

  @ApiProperty({ description: 'Shop phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;
} 