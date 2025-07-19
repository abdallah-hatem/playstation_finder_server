import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationWithSortAndSearchDto } from './pagination.dto';
import { ReservationStatus } from '../common/enums/reservation-type.enum';

export class ReservationFilterDto extends PaginationWithSortAndSearchDto {
  @ApiPropertyOptional({
    enum: ReservationStatus,
    description: 'Filter by reservation status',
    example: ReservationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
} 