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
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ReservationService } from "../services/reservation.service";
import { CreateReservationDto } from "../dto/create-reservation.dto";
import { ResponseInterceptor } from "../common/interceptors/response.interceptor";
import { ApiResponseSuccess } from "../common/decorators/api-response.decorator";
import {
  CurrentAppUser,
  CurrentOwner,
} from "../common/decorators/current-user.decorator";
import { User } from "../entities/user.entity";
import { Owner } from "../entities/owner.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OwnerOnlyGuard } from "../auth/owner-only.guard";
import { PaginationDto, PaginationWithSortDto, PaginationWithSortAndSearchDto } from "../dto/pagination.dto";
import { ReservationFilterDto } from "../dto/reservation-filter.dto";
import { SplitReservationDto } from "../dto/split-reservation.dto";
import { UpdateReservationStatusDto } from "../dto/update-reservation-status.dto";
import { ReservationStatusService } from "../services/reservation-status.service";
import {
  ApiPagination,
  ApiPaginationWithSort,
  ApiPaginationWithSortAndSearch,
  ApiReservationFilter,
} from "../common/decorators/pagination.decorator";

@ApiTags("reservations")
@Controller("reservations")
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly reservationStatusService: ReservationStatusService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new reservation" })
  @ApiResponseSuccess({ message: "Reservation created successfully" })
  create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentAppUser() user: User
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

  // @Get("my-reservations")
  // @ApiOperation({ summary: "Get current user reservations" })
  // @ApiResponseSuccess({ message: "My reservations retrieved successfully" })
  // findMyReservations(@CurrentAppUser() user: User) {
  //   return this.reservationService.findByUser(user.id);
  // }

  @Get("my-reservations")
  @ApiOperation({ summary: "Get current user reservations with pagination, sorting, search, and status filtering" })
  @ApiReservationFilter()
  @ApiQuery({
    name: "shopId",
    description: "Filter by shop ID",
    required: false,
  })
  @ApiResponseSuccess({ message: "My reservations retrieved successfully" })
  findMyReservationsPaginatedWithSortAndSearch(
    @Query() reservationFilterDto: ReservationFilterDto,
    @CurrentAppUser() user: User,
    @Query("shopId") shopId?: string
  ) {
    return this.reservationService.findByUserWithSearchPaginatedWithSort(user.id, reservationFilterDto, shopId);
  }

  // @Get("my-owner-reservations")
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({ summary: "Get current owner reservations" })
  // @ApiResponseSuccess({
  //   message: "My owner reservations retrieved successfully",
  // })
  // findMyOwnerReservations(@CurrentOwner() owner: Owner) {
  //   return this.reservationService.findByOwner(owner.id);
  // }

  @Get("my-owner-reservations")
  @UseGuards(OwnerOnlyGuard)
  @ApiOperation({ summary: "Get current owner reservations with pagination, sorting, search, and status filtering" })
  @ApiReservationFilter()
  @ApiQuery({
    name: "shopId",
    description: "Filter by shop ID",
    required: false,
  })
  @ApiResponseSuccess({
    message: "My owner reservations retrieved successfully",
  })
  findMyOwnerReservationsPaginatedWithSortAndSearch(
    @Query() reservationFilterDto: ReservationFilterDto,
    @CurrentOwner() owner: Owner,
    @Query("shopId") shopId?: string
  ) {
    return this.reservationService.findByOwnerWithSearchPaginatedWithSort(owner.id, reservationFilterDto, shopId);
  }

  // @Get('all/paginated')
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({ summary: 'Get all reservations with pagination (admin only)' })
  // @ApiPagination()
  // @ApiResponseSuccess({ message: 'All reservations retrieved successfully' })
  // findAllPaginated(@Query() paginationDto: PaginationDto) {
  //   return this.reservationService.findAllPaginated(paginationDto);
  // }

  // @Get("all")
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({
  //   summary: "Get all reservations with pagination and sorting (admin only)",
  // })
  // @ApiPaginationWithSort()
  // @ApiResponseSuccess({ message: "All reservations retrieved successfully" })
  // findAllPaginatedWithSort(
  //   @Query() paginationWithSortDto: PaginationWithSortDto
  // ) {
  //   return this.reservationService.findAllPaginatedWithSort(
  //     paginationWithSortDto
  //   );
  // }

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

  @Patch(':id/status')
  @UseGuards(OwnerOnlyGuard)
  @ApiOperation({ summary: 'Update reservation status (owner only)' })
  @ApiResponseSuccess({ message: 'Reservation status updated successfully' })
  updateReservationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateReservationStatusDto,
    @CurrentOwner() owner: Owner,
  ) {
    return this.reservationStatusService.updateReservationStatusByOwner(
      id,
      updateStatusDto.status,
      owner.id,
    );
  }

  @Get(':id/valid-statuses')
  @UseGuards(OwnerOnlyGuard)
  @ApiOperation({ summary: 'Get valid status transitions for a reservation (owner only)' })
  @ApiResponseSuccess({ message: 'Valid status transitions retrieved successfully' })
  getValidStatusTransitions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.reservationStatusService.getValidStatusTransitions(id, owner.id);
  }

  @Get(':id/remaining-slots')
  @UseGuards(OwnerOnlyGuard)
  @ApiOperation({ 
    summary: 'Get remaining slots for a reservation (owner only)',
    description: 'Returns information about remaining time slots that can be split for an in-progress reservation.'
  })
  @ApiResponseSuccess({ message: 'Remaining slots retrieved successfully' })
  getRemainingSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.reservationService.getRemainingSlots(id, owner.id);
  }

  @Post(':id/split')
  @UseGuards(OwnerOnlyGuard)
  @ApiOperation({ 
    summary: 'Split an in-progress reservation into multiple reservations (owner only)',
    description: 'Allows the owner to split an in-progress reservation into multiple new reservations with different types. Only remaining time slots can be split.'
  })
  @ApiResponseSuccess({ message: 'Reservation split successfully' })
  splitReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() splitDto: SplitReservationDto,
    @CurrentOwner() owner: Owner,
  ) {
    return this.reservationService.splitInProgressReservation(id, owner.id, splitDto);
  }

  // @Post(':id/auto-update-status')
  // @UseGuards(OwnerOnlyGuard)
  // @ApiOperation({ summary: 'Manually trigger status update based on time (owner only)' })
  // @ApiResponseSuccess({ message: 'Reservation status updated based on time' })
  // triggerStatusUpdate(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @CurrentOwner() owner: Owner,
  // ) {
  //   return this.reservationStatusService.updateReservationStatusBasedOnTime(id);
  // }
}
