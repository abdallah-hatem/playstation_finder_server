import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseUUIDPipe,
  Query,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoomService } from '../services/room.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomRatesDto } from '../dto/update-room-rates.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentOwner } from '../common/decorators/current-user.decorator';
import { Owner } from '../entities/owner.entity';

@ApiTags('rooms')
@Controller('rooms')
@UseInterceptors(ResponseInterceptor)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new room (owner only)' })
  @ApiResponseSuccess({ message: 'Room created successfully' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get rooms for authenticated owner' })
  @ApiResponseSuccess({ message: 'Owner rooms retrieved successfully' })
  findMyRooms(@CurrentOwner() owner: Owner) {
    return this.roomService.findByOwner(owner.id);
  }

  // @Get('all')
  // @Public()
  // @ApiOperation({ summary: 'Get all rooms (public)' })
  // @ApiResponseSuccess({ message: 'All rooms retrieved successfully' })
  // findAll() {
  //   return this.roomService.findAll();
  // }

  // @Get('available')
  // @Public()
  // @ApiOperation({ summary: 'Get available rooms' })
  // @ApiQuery({ name: 'shopId', description: 'Filter by shop ID', required: false })
  // @ApiResponseSuccess({ message: 'Available rooms retrieved successfully' })
  // findAvailable(@Query('shopId') shopId?: string) {
  //   return this.roomService.findAvailable(shopId);
  // }

  @Get('shop/:shopId')
  @Public()
  @ApiOperation({ summary: 'Get rooms by shop with reservations' })
  @ApiQuery({ name: 'startDate', description: 'Start date for reservations (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date for reservations (YYYY-MM-DD)', required: false })
  @ApiResponseSuccess({ message: 'Shop rooms with reservations retrieved successfully' })
  findByShop(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.roomService.findByShop(shopId, startDate, endDate);
  }

  // @Get('device/:deviceId')
  // @Public()
  // @ApiOperation({ summary: 'Get rooms by device' })
  // @ApiResponseSuccess({ message: 'Device rooms retrieved successfully' })
  // findByDevice(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
  //   return this.roomService.findByDevice(deviceId);
  // }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get room by ID with reservations' })
  @ApiResponseSuccess({ message: 'Room with reservations retrieved successfully' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findOneById(id);
  }

  @Get(':id/with-rates')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get room with time slot rates (owner only)' })
  @ApiResponseSuccess({ message: 'Room with time slot rates retrieved successfully' })
  findOneWithTimeSlotRates(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.getTimeSlotRatesWithinOperatingHours(id);
  }

  // @Get(':id/operating-hours-rates')
  // @Public()
  // @ApiOperation({ 
  //   summary: 'Get room with time slot rates filtered by shop operating hours', 
  //   description: 'Returns only time slot rates that fall within the shop\'s opening and closing times'
  // })
  // @ApiResponseSuccess({ message: 'Room with operating hours time slot rates retrieved successfully' })
  // findTimeSlotRatesWithinOperatingHours(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.roomService.getTimeSlotRatesWithinOperatingHours(id);
  // }

  // @Get(':id/availability/:date')
  // @Public()
  // @ApiOperation({ summary: 'Get room availability for a specific date' })
  // @ApiResponseSuccess({ message: 'Room availability retrieved successfully' })
  // getAvailability(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Param('date') date: string,
  // ) {
  //   return this.roomService.getAvailableTimeSlots(id, date);
  // }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update room (owner only)', 
    description: 'Updates room details. If default rates (singleHourlyRate, multiHourlyRate, otherHourlyRate) are updated, ALL time slot rates for this room will be automatically updated to match the new default rates.'
  })
  @ApiResponseSuccess({ message: 'Room updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: Partial<CreateRoomDto>,
  ) {
    return this.roomService.update(id, updateRoomDto);
  }


  // @Patch(':id/availability')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Update room availability' })
  // @ApiResponseSuccess({ message: 'Room availability updated successfully' })
  // updateAvailability(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body('isAvailable', ParseBoolPipe) isAvailable: boolean,
  // ) {
  //   return this.roomService.updateAvailability(id, isAvailable);
  // }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete room (owner only)' })
  @ApiResponseSuccess({ message: 'Room deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.remove(id);
  }
} 