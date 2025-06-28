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
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Owner } from '../entities/owner.entity';

@ApiTags('rooms')
@Controller('rooms')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponseSuccess({ message: 'Room created successfully' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rooms for authenticated owner' })
  @ApiResponseSuccess({ message: 'Owner rooms retrieved successfully' })
  findMyRooms(@CurrentUser() owner: Owner) {
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
  @ApiOperation({ summary: 'Get rooms by shop' })
  @ApiResponseSuccess({ message: 'Shop rooms retrieved successfully' })
  findByShop(@Param('shopId', ParseUUIDPipe) shopId: string) {
    return this.roomService.findByShop(shopId);
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
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponseSuccess({ message: 'Room retrieved successfully' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.findOneById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update room' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete room' })
  @ApiResponseSuccess({ message: 'Room deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomService.remove(id);
  }
} 