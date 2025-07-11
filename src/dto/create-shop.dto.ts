import { IsNotEmpty, IsString, IsArray, IsOptional, IsUrl, ValidateIf, Matches, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

// Custom validator for shop operating hours
function ValidateShopHours(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateShopHours',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as CreateShopDto;
          
          if (!obj.openingTime || !obj.closingTime) {
            return false;
          }

          // Parse time strings to minutes for comparison
          const parseTime = (timeStr: string): number => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const openingMinutes = parseTime(obj.openingTime);
          const closingMinutes = parseTime(obj.closingTime);

          // Opening time must be before closing time
          return openingMinutes < closingMinutes;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Opening time must be before closing time';
        },
      },
    });
  };
}

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

  @ApiProperty({ description: 'Shop opening time in HH:MM format', example: '09:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Opening time must be in HH:MM format (e.g., 09:00)' })
  @ValidateShopHours()
  openingTime: string;

  @ApiProperty({ description: 'Shop closing time in HH:MM format', example: '22:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Closing time must be in HH:MM format (e.g., 22:00)' })
  closingTime: string;

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

  @ApiProperty({ description: 'Shop opening time in HH:MM format', example: '09:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Opening time must be in HH:MM format (e.g., 09:00)' })
  @ValidateShopHours()
  openingTime: string;

  @ApiProperty({ description: 'Shop closing time in HH:MM format', example: '22:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Closing time must be in HH:MM format (e.g., 22:00)' })
  closingTime: string;

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

  @ApiPropertyOptional({ description: 'Shop opening time in HH:MM format', example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Opening time must be in HH:MM format (e.g., 09:00)' })
  openingTime?: string;

  @ApiPropertyOptional({ description: 'Shop closing time in HH:MM format', example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Closing time must be in HH:MM format (e.g., 22:00)' })
  closingTime?: string;

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