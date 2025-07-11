import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomDisablePeriodResponseDto {
  @ApiProperty({ description: 'Disable period ID' })
  id: string;

  @ApiProperty({ description: 'Room ID' })
  roomId: string;

  @ApiProperty({ description: 'Owner ID' })
  ownerId: string;

  @ApiProperty({ description: 'Start date and time for the disable period' })
  startDateTime: Date;

  @ApiProperty({ description: 'End date and time for the disable period' })
  endDateTime: Date;

  @ApiPropertyOptional({ description: 'Reason for disabling the room' })
  reason?: string;

  @ApiProperty({ description: 'When the disable period was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the disable period was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Room details' })
  room?: {
    id: string;
    name: string;
    shopId: string;
  };

  @ApiPropertyOptional({ description: 'Owner details' })
  owner?: {
    id: string;
    name: string;
    email: string;
  };
} 