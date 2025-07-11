import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { CurrentOwner } from '../common/decorators/current-user.decorator';
import { Owner } from '../entities/owner.entity';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { RoomDisablePeriodService } from '../services/room-disable-period.service';
import { CreateRoomDisablePeriodDto } from '../dto/create-room-disable-period.dto';
import { RoomDisablePeriodResponseDto } from '../dto/room-disable-period-response.dto';

@ApiTags('room-disable-periods')
@Controller('rooms')
@UseInterceptors(ResponseInterceptor)
export class RoomDisablePeriodController {
  constructor(private readonly roomDisablePeriodService: RoomDisablePeriodService) {}

  @Post(':id/disable-period')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Disable a room for a specific time period',
    description: 'Create a disable period for a room. Only shop owners can disable their own rooms. Example: disable from today at 4pm to sunday at 2am'
  })
  @ApiResponseSuccess({ message: 'Room disable period created successfully' })
  @ApiResponse({ status: 200, type: RoomDisablePeriodResponseDto })
  async createDisablePeriod(
    @Param('id', ParseUUIDPipe) roomId: string,
    @CurrentOwner() owner: Owner,
    @Body() createDto: CreateRoomDisablePeriodDto,
  ) {
    return await this.roomDisablePeriodService.createDisablePeriod(roomId, owner.id, createDto);
  }

  @Get(':id/disable-periods')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all disable periods for a room',
    description: 'Get current and future disable periods for a specific room'
  })
  @ApiResponseSuccess({ message: 'Room disable periods retrieved successfully' })
  @ApiResponse({ status: 200, type: [RoomDisablePeriodResponseDto] })
  async getDisablePeriodsForRoom(@Param('id', ParseUUIDPipe) roomId: string) {
    return await this.roomDisablePeriodService.getDisablePeriodsForRoom(roomId);
  }

  @Put('disable-periods/:periodId')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update a disable period',
    description: 'Update an existing disable period. Only the owner who created it can update it'
  })
  @ApiResponseSuccess({ message: 'Room disable period updated successfully' })
  @ApiResponse({ status: 200, type: RoomDisablePeriodResponseDto })
  async updateDisablePeriod(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @CurrentOwner() owner: Owner,
    @Body() updateDto: CreateRoomDisablePeriodDto,
  ) {
    return await this.roomDisablePeriodService.updateDisablePeriod(periodId, owner.id, updateDto);
  }

  @Delete('disable-periods/:periodId')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete a disable period',
    description: 'Delete an existing disable period. Only the owner who created it can delete it'
  })
  @ApiResponseSuccess({ 
    message: 'Room disable period deleted successfully'
  })
  async deleteDisablePeriod(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @CurrentOwner() owner: Owner,
  ) {
    await this.roomDisablePeriodService.deleteDisablePeriod(periodId, owner.id);
    return { message: 'Room disable period deleted successfully' };
  }
} 