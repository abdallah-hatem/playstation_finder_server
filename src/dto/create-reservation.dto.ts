import { IsNotEmpty, IsNumber, IsEnum, IsDateString, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationType } from '../common/enums/reservation-type.enum';

export class CreateReservationDto {
  @ApiProperty({ description: 'Room ID' })
  @IsNotEmpty()
  @IsUUID()
  roomId: string;

  @ApiProperty({ description: 'Reservation date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Reservation type', enum: ReservationType })
  @IsEnum(ReservationType)
  type: ReservationType;

  @ApiProperty({ description: 'Time slots for the reservation', type: [String] })
  @IsArray()
  @IsNotEmpty({ each: true })
  timeSlots: string[];
} 