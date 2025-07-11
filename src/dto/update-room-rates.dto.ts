import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomRatesDto {
  @ApiPropertyOptional({ 
    description: 'Single hourly rate (will be applied to all time slots)', 
    example: 25.50,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  singleHourlyRate?: number;

  @ApiPropertyOptional({ 
    description: 'Multi hourly rate (will be applied to all time slots)', 
    example: 20.00,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  multiHourlyRate?: number;

  @ApiPropertyOptional({ 
    description: 'Other hourly rate (will be applied to all time slots)', 
    example: 30.00,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherHourlyRate?: number;
} 