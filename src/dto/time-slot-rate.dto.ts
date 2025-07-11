import { IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTimeSlotRateDto {
  @ApiProperty({ description: 'Time slot in HH:MM format', example: '04:00' })
  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @ApiPropertyOptional({ description: 'Single hourly rate', example: 25.50 })
  @IsOptional()
  @IsNumber()
  singleHourlyRate?: number;

  @ApiPropertyOptional({ description: 'Multi hourly rate', example: 20.00 })
  @IsOptional()
  @IsNumber()
  multiHourlyRate?: number;

  @ApiPropertyOptional({ description: 'Other hourly rate', example: 30.00 })
  @IsOptional()
  @IsNumber()
  otherHourlyRate?: number;
}

export class UpdateTimeSlotRateDto {
  @ApiPropertyOptional({ description: 'Single hourly rate', example: 25.50 })
  @IsOptional()
  @IsNumber()
  singleHourlyRate?: number;

  @ApiPropertyOptional({ description: 'Multi hourly rate', example: 20.00 })
  @IsOptional()
  @IsNumber()
  multiHourlyRate?: number;

  @ApiPropertyOptional({ description: 'Other hourly rate', example: 30.00 })
  @IsOptional()
  @IsNumber()
  otherHourlyRate?: number;
}

export class BatchCreateTimeSlotRatesDto {
  @ApiProperty({ description: 'Room ID to set rates for' })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ 
    description: 'Array of time slot rates',
    type: [CreateTimeSlotRateDto],
    example: [
      { timeSlot: '04:00', singleHourlyRate: 25.50, multiHourlyRate: 20.00, otherHourlyRate: 30.00 },
      { timeSlot: '04:30', singleHourlyRate: 25.50, multiHourlyRate: 20.00, otherHourlyRate: 30.00 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimeSlotRateDto)
  timeSlotRates: CreateTimeSlotRateDto[];
}

export class TimeSlotRateResponseDto {
  @ApiProperty({ description: 'Time slot rate ID' })
  id: string;

  @ApiProperty({ description: 'Room ID' })
  roomId: string;

  @ApiProperty({ description: 'Time slot' })
  timeSlot: string;

  @ApiProperty({ description: 'Single hourly rate' })
  singleHourlyRate: number | null;

  @ApiProperty({ description: 'Multi hourly rate' })
  multiHourlyRate: number | null;

  @ApiProperty({ description: 'Other hourly rate' })
  otherHourlyRate: number | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
} 