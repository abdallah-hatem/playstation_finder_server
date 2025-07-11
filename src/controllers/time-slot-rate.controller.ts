import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimeSlotRateService } from '../services/time-slot-rate.service';
import { 
  CreateTimeSlotRateDto, 
  UpdateTimeSlotRateDto, 
  BatchCreateTimeSlotRatesDto,
  TimeSlotRateResponseDto 
} from '../dto/time-slot-rate.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';

@ApiTags('time-slot-rates')
@Controller('time-slot-rates')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard, OwnerOnlyGuard)
@ApiBearerAuth('JWT-auth')
export class TimeSlotRateController {
  constructor(private readonly timeSlotRateService: TimeSlotRateService) {}

  // @Post('batch')
  // @ApiOperation({ summary: 'Create multiple time slot rates for a room (owner only)' })
  // @ApiResponseSuccess({ message: 'Time slot rates created successfully' })
  // batchCreateTimeSlotRates(@Body() batchDto: BatchCreateTimeSlotRatesDto) {
  //   return this.timeSlotRateService.batchCreateTimeSlotRates(batchDto);
  // }

  // @Post('room/:roomId')
  // @ApiOperation({ summary: 'Create a single time slot rate for a room (owner only)' })
  // @ApiResponseSuccess({ message: 'Time slot rate created successfully' })
  // createTimeSlotRate(
  //   @Param('roomId', ParseUUIDPipe) roomId: string,
  //   @Body() createDto: CreateTimeSlotRateDto,
  // ) {
  //   return this.timeSlotRateService.createTimeSlotRate(roomId, createDto);
  // }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get all time slot rates for a room (owner only)' })
  @ApiResponseSuccess({ message: 'Time slot rates retrieved successfully' })
  getTimeSlotRatesByRoom(@Param('roomId', ParseUUIDPipe) roomId: string) {
    return this.timeSlotRateService.getTimeSlotRatesByRoom(roomId);
  }

  // @Get('room/:roomId/time-slot/:timeSlot')
  // @ApiOperation({ summary: 'Get specific time slot rate for a room (owner only)' })
  // @ApiResponseSuccess({ message: 'Time slot rate retrieved successfully' })
  // getTimeSlotRate(
  //   @Param('roomId', ParseUUIDPipe) roomId: string,
  //   @Param('timeSlot') timeSlot: string,
  // ) {
  //   return this.timeSlotRateService.getTimeSlotRate(roomId, timeSlot);
  // }

  @Put('room/:roomId/time-slot/:timeSlot')
  @ApiOperation({ summary: 'Update specific time slot rate for a room (owner only)' })
  @ApiResponseSuccess({ message: 'Time slot rate updated successfully' })
  updateTimeSlotRate(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('timeSlot') timeSlot: string,
    @Body() updateDto: UpdateTimeSlotRateDto,
  ) {
    return this.timeSlotRateService.updateTimeSlotRate(roomId, timeSlot, updateDto);
  }

  // @Delete('room/:roomId/time-slot/:timeSlot')
  // @ApiOperation({ summary: 'Delete specific time slot rate for a room (owner only)' })
  // @ApiResponseSuccess({ message: 'Time slot rate deleted successfully' })
  // deleteTimeSlotRate(
  //   @Param('roomId', ParseUUIDPipe) roomId: string,
  //   @Param('timeSlot') timeSlot: string,
  // ) {
  //   return this.timeSlotRateService.deleteTimeSlotRate(roomId, timeSlot);
  // }

  // @Delete('room/:roomId')
  // @ApiOperation({ summary: 'Delete all time slot rates for a room (owner only)' })
  // @ApiResponseSuccess({ message: 'All time slot rates deleted successfully' })
  // deleteAllTimeSlotRatesForRoom(@Param('roomId', ParseUUIDPipe) roomId: string) {
  //   return this.timeSlotRateService.deleteAllTimeSlotRatesForRoom(roomId);
  // }

  // @Post('room/:roomId/generate-default')
  // @ApiOperation({ summary: 'Generate default time slots (04:00-23:30) with optional default rates (owner only)' })
  // @ApiResponseSuccess({ message: 'Default time slots generated successfully' })
  // generateDefaultTimeSlots(
  //   @Param('roomId', ParseUUIDPipe) roomId: string,
  //   @Body() defaultRates?: Partial<CreateTimeSlotRateDto>,
  // ) {
  //   return this.timeSlotRateService.generateDefaultTimeSlots(roomId, defaultRates);
  // }
} 