import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsUUID, IsOptional, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Custom validator for room pricing logic
function ValidateRoomPricing(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateRoomPricing',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as CreateRoomDto;
          const hasSingle = obj.singleHourlyRate !== null && obj.singleHourlyRate !== undefined;
          const hasMulti = obj.multiHourlyRate !== null && obj.multiHourlyRate !== undefined;
          const hasOther = obj.otherHourlyRate !== null && obj.otherHourlyRate !== undefined;

          // If any single or multi is set, both must be set
          if (hasSingle || hasMulti) {
            return hasSingle && hasMulti;
          }

          // If neither single nor multi is set, other must be set
          if (!hasSingle && !hasMulti) {
            return hasOther;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Either set both single_hourly_rate and multi_hourly_rate, or set only other_hourly_rate';
        },
      },
    });
  };
}

export class CreateRoomDto {
  @ApiProperty({ description: 'Shop ID' })
  @IsNotEmpty()
  @IsUUID()
  shopId: string;

  @ApiProperty({ description: 'Room name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Room capacity' })
  @IsNumber()
  capacity: number;

  @ApiProperty({ description: 'Device ID' })
  @IsNotEmpty()
  @IsUUID()
  deviceId: string;

  @ApiPropertyOptional({ description: 'Single player hourly rate (required if multi_hourly_rate is set)' })
  @IsOptional()
  @IsNumber()
  @ValidateRoomPricing()
  singleHourlyRate?: number | null;

  @ApiPropertyOptional({ description: 'Multi player hourly rate (required if single_hourly_rate is set)' })
  @IsOptional()
  @IsNumber()
  multiHourlyRate?: number | null;

  @ApiPropertyOptional({ description: 'Other activity hourly rate (can be used alone or with single/multi rates)' })
  @IsOptional()
  @IsNumber()
  otherHourlyRate?: number | null;

  @ApiProperty({ description: 'Room availability status', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;
} 