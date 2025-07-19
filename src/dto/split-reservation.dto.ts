import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationType } from '../common/enums/reservation-type.enum';

export class NewReservationSlotDto {
  @ApiProperty({
    description: 'Number of slots for this new reservation',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  slotCount: number;

  @ApiProperty({
    enum: ReservationType,
    description: 'Type of the new reservation',
    example: ReservationType.MULTI,
  })
  @IsEnum(ReservationType)
  type: ReservationType;
}

export class SplitReservationDto {
  @ApiProperty({
    type: [NewReservationSlotDto],
    description: 'Array of new reservations to create from the remaining slots',
    example: [
      { slotCount: 2, type: ReservationType.SINGLE },
      { slotCount: 2, type: ReservationType.MULTI }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewReservationSlotDto)
  newReservations: NewReservationSlotDto[];
} 