import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../common/enums/reservation-type.enum';

export class UpdateReservationStatusDto {
  @ApiProperty({
    description: 'New reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.IN_PROGRESS,
  })
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;
} 