import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseInterceptors,
  ParseUUIDPipe,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationService } from '../services/reservation.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { CurrentAppUser, CurrentOwner } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { Owner } from '../entities/owner.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';

@ApiTags('reservations')
@Controller('reservations')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponseSuccess({ message: 'Reservation created successfully' })
  create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentAppUser() user: User,
  ) {
    return this.reservationService.create(createReservationDto, user.id);
  }

  // @Get()
  // @ApiOperation({ summary: 'Get all reservations' })
  // @ApiResponseSuccess({ message: 'Reservations retrieved successfully' })
  // findAll() {
  //   return this.reservationService.findAll();
  // }

  // @Get('date-range')
  // @ApiOperation({ summary: 'Get reservations by date range' })
  // @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  // @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  // @ApiResponseSuccess({ message: 'Reservations retrieved successfully' })
  // findByDateRange(
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ) {
  //   return this.reservationService.findByDateRange(startDate, endDate);
  // }

  // @Get('user/:userId')
  // @ApiOperation({ summary: 'Get reservations by user' })
  // @ApiResponseSuccess({ message: 'User reservations retrieved successfully' })
  // findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
  //   return this.reservationService.findByUser(userId);
  // }

  @Get('my-reservations')
  @ApiOperation({ summary: 'Get current user reservations' })
  @ApiResponseSuccess({ message: 'My reservations retrieved successfully' })
  findMyReservations(@CurrentAppUser() user: User) {
    return this.reservationService.findByUser(user.id);
  }

  @Get('my-owner-reservations')
  @UseGuards(OwnerOnlyGuard)
  @ApiOperation({ summary: 'Get current owner reservations' })
  @ApiResponseSuccess({ message: 'My owner reservations retrieved successfully' })
  findMyOwnerReservations(@CurrentOwner() owner: Owner) {
    return this.reservationService.findByOwner(owner.id);
  }

  // @Get('room/:roomId')
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({ summary: 'Get reservations by room (owner only)' })
  // @ApiResponseSuccess({ message: 'Room reservations retrieved successfully' })
  // findByRoom(@Param('roomId', ParseUUIDPipe) roomId: string, @CurrentOwner() owner: Owner) {
  //   return this.reservationService.findByRoomForOwner(roomId, owner.id);
  // }

  // @Get('owner/:ownerId')
  // @ApiOperation({ summary: 'Get all reservations for an owner' })
  // @ApiResponseSuccess({ message: 'Owner reservations retrieved successfully' })
  // findByOwner(@Param('ownerId', ParseUUIDPipe) ownerId: string) {
  //   return this.reservationService.findByOwner(ownerId);
  // }

  // @Get('shop/:shopId')
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({ summary: 'Get reservations by shop (owner only)' })
  // @ApiResponseSuccess({ message: 'Shop reservations retrieved successfully' })
  // findByShop(@Param('shopId', ParseUUIDPipe) shopId: string, @CurrentOwner() owner: Owner) {
  //   return this.reservationService.findByShopForOwner(shopId, owner.id);
  // }

  // @Get(':id')
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({ summary: 'Get reservation by ID (owner only)' })
  // @ApiResponseSuccess({ message: 'Reservation retrieved successfully' })
  // findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentOwner() owner: Owner) {
  //   return this.reservationService.findOneForOwner(id, owner.id);
  // }

  // @Delete(':id')
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({ summary: 'Delete reservation (owner only)' })
  // @ApiResponseSuccess({ message: 'Reservation deleted successfully' })
  // remove(@Param('id', ParseUUIDPipe) id: string, @CurrentOwner() owner: Owner) {
  //   return this.reservationService.removeForOwner(id, owner.id);
  // }
} 