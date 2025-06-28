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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReservationService } from '../services/reservation.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';

@ApiTags('reservations')
@Controller('reservations')
@UseInterceptors(ResponseInterceptor)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponseSuccess({ message: 'Reservation created successfully' })
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations' })
  @ApiResponseSuccess({ message: 'Reservations retrieved successfully' })
  findAll() {
    return this.reservationService.findAll();
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get reservations by date range' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponseSuccess({ message: 'Reservations retrieved successfully' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reservationService.findByDateRange(startDate, endDate);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reservations by user' })
  @ApiResponseSuccess({ message: 'User reservations retrieved successfully' })
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reservationService.findByUser(userId);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get reservations by room' })
  @ApiResponseSuccess({ message: 'Room reservations retrieved successfully' })
  findByRoom(@Param('roomId', ParseUUIDPipe) roomId: string) {
    return this.reservationService.findByRoom(roomId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponseSuccess({ message: 'Reservation retrieved successfully' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete reservation' })
  @ApiResponseSuccess({ message: 'Reservation deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationService.remove(id);
  }
} 