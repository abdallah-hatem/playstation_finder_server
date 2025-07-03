import { IsNotEmpty, IsString, IsArray, IsOptional, IsUrl, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
  @IsNotEmpty()
  @IsString()
  lat: string;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNotEmpty()
  @IsString()
  long: string;

  @ApiProperty({ description: 'Shop phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Main shop image URL' })
  @IsOptional()
  @ValidateIf((o) => o.image !== null && o.image !== undefined && o.image !== '')
  @IsString()
  @IsUrl({}, { message: 'Image must be a valid URL' })
  image?: string;

  @ApiPropertyOptional({ 
    description: 'Additional shop images URLs', 
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle empty string or null values from form data
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return undefined;
    }
    return value;
  })
  @ValidateIf((o) => o.images !== null && o.images !== undefined && o.images !== '' && Array.isArray(o.images) && o.images.length > 0)
  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true, message: 'Each image must be a valid URL' })
  images?: string[];
}

export class CreateShopWithImagesDto {
  @ApiProperty({ description: 'Shop name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Shop address' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNotEmpty()
  @IsString()
  lat: string;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNotEmpty()
  @IsString()
  long: string;

  @ApiProperty({ description: 'Shop phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ 
    type: 'string',
    format: 'binary',
    description: 'Main shop image'
  })
  image?: Express.Multer.File;

  @ApiPropertyOptional({ 
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Additional shop images for gallery'
  })
  images?: Express.Multer.File[];
}

export class UpdateShopWithImagesDto {
  @ApiPropertyOptional({ description: 'Shop name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Shop address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsString()
  lat?: string;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsString()
  long?: string;

  @ApiPropertyOptional({ description: 'Shop phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ 
    type: 'string',
    format: 'binary',
    description: 'Replace main shop image'
  })
  image?: Express.Multer.File;

  @ApiPropertyOptional({ 
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Replace shop gallery images'
  })
  images?: Express.Multer.File[];
}

export interface UpdateShopDto extends Partial<CreateShopDto> {} 