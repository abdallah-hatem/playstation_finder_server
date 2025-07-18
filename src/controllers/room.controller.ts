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
import { PaginationDto, PaginationWithSortDto } from '../dto/pagination.dto';
import { ApiPagination, ApiPaginationWithSort } from '../common/decorators/pagination.decorator';

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

  // @Get()
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Get rooms for authenticated owner' })
  // @ApiResponseSuccess({ message: 'Owner rooms retrieved successfully' })
  // findMyRooms(@CurrentOwner() owner: Owner) {
  //   return this.roomService.findByOwner(owner.id);
  // }

  // @Get('paginated')
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Get owner rooms with pagination' })
  // @ApiPagination()
  // @ApiResponseSuccess({ message: 'Owner rooms retrieved successfully' })
  // findMyRoomsPaginated(@Query() paginationDto: PaginationDto, @CurrentOwner() owner: Owner) {
  //   return this.roomService.findByOwnerPaginated(owner.id, paginationDto);
  // }

  @Get()
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get owner rooms with pagination and sorting' })
  @ApiPaginationWithSort()
  @ApiResponseSuccess({ message: 'Owner rooms retrieved successfully' })
  findMyRoomsPaginatedWithSort(@Query() paginationWithSortDto: PaginationWithSortDto, @CurrentOwner() owner: Owner) {
    return this.roomService.findByOwnerPaginatedWithSort(owner.id, paginationWithSortDto);
  }

  // @Get('all/paginated')
  // @Public()
  // @ApiOperation({ summary: 'Get all rooms with pagination (public)' })
  // @ApiPagination()
  // @ApiResponseSuccess({ message: 'All rooms retrieved successfully' })
  // findAllPaginated(@Query() paginationDto: PaginationDto) {
  //   return this.roomService.findAllPaginated(paginationDto);
  // }

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Get all rooms with pagination and sorting (public)' })
  @ApiPaginationWithSort()
  @ApiResponseSuccess({ message: 'All rooms retrieved successfully' })
  findAllPaginatedWithSort(@Query() paginationWithSortDto: PaginationWithSortDto) {
    return this.roomService.findAllPaginatedWithSort(paginationWithSortDto);
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
  @ApiOperation({ summary: 'Get rooms by shop with time slot rates and availability status for a specific date' })
  @ApiQuery({ name: 'date', description: 'Date to get room data and check availability (YYYY-MM-DD), defaults to today', required: false })
  @ApiResponseSuccess({ message: 'Shop rooms with time slot rates and availability retrieved successfully' })
  findByShop(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query('date') date?: string,
  ) {
    return this.roomService.findByShopForDate(shopId, date);
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