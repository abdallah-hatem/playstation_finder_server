import { IsNotEmpty, IsOptional, IsString, IsDateString, ValidateBy, ValidationOptions, registerDecorator } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Custom validator to check that end date is after start date
function IsAfterStartDate(property: string, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isAfterStartDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: any) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return new Date(value) > new Date(relatedValue);
        },
        defaultMessage() {
          return 'End date time must be after start date time';
        },
      },
    });
  };
}

// Custom validator to check that start date is in the future (or current time)
function IsNotInThePast(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isNotInThePast',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return new Date(value) >= new Date();
        },
        defaultMessage() {
          return 'Start date time cannot be in the past';
        },
      },
    });
  };
}

export class CreateRoomDisablePeriodDto {
  @ApiProperty({ 
    description: 'Start date and time for the disable period', 
    example: '2024-01-15T16:00:00.000Z',
    type: String 
  })
  @IsNotEmpty()
  @IsDateString()
  @IsNotInThePast()
  startDateTime: string;

  @ApiProperty({ 
    description: 'End date and time for the disable period', 
    example: '2024-01-21T02:00:00.000Z',
    type: String 
  })
  @IsNotEmpty()
  @IsDateString()
  @IsAfterStartDate('startDateTime')
  endDateTime: string;

  @ApiPropertyOptional({ 
    description: 'Optional reason for disabling the room',
    example: 'Maintenance work'
  })
  @IsOptional()
  @IsString()
  reason?: string;
} 