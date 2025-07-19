import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { ReservationRepository } from "../repositories/reservation.repository";
import { RoomRepository } from "../repositories/room.repository";
import { UserRepository } from "../repositories/user.repository";
import { ShopRepository } from "../repositories/shop.repository";
import { RoomDisablePeriodService } from "./room-disable-period.service";
import { CreateReservationDto } from "../dto/create-reservation.dto";
import { Reservation } from "../entities/reservation.entity";
import { ReservationSlot } from "../entities/reservation-slot.entity";
import { ReservationType } from "../common/enums/reservation-type.enum";
import { PaginationDto, PaginationWithSortDto, PaginationWithSortAndSearchDto } from "../dto/pagination.dto";
import { PaginatedResponse } from "../common/interfaces/api-response.interface";

@Injectable()
export class ReservationService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly roomRepository: RoomRepository,
    private readonly userRepository: UserRepository,
    private readonly shopRepository: ShopRepository,
    private readonly roomDisablePeriodService: RoomDisablePeriodService,
    @InjectRepository(ReservationSlot)
    private readonly reservationSlotRepository: Repository<ReservationSlot>
  ) {}

  // Helper method to verify if an owner owns a reservation
  private async verifyOwnerOwnsReservation(
    reservationId: string,
    ownerId: string
  ): Promise<void> {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }

    const room = await this.roomRepository.findById(reservation.roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }

    // Check if the room belongs to one of the owner's shops
    const ownerReservations =
      await this.reservationRepository.findAllReservationsByOwnerId(ownerId);
    const ownerReservationIds = ownerReservations.map((r) => r.id);

    if (!ownerReservationIds.includes(reservationId)) {
      throw new ForbiddenException(
        "You can only access reservations for your own rooms"
      );
    }
  }

  // Helper method to verify if an owner owns a room
  private async verifyOwnerOwnsRoom(
    roomId: string,
    ownerId: string
  ): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }

    // The findById method already includes shop relationship
    if (!room.shop || room.shop.ownerId !== ownerId) {
      throw new ForbiddenException(
        "You can only access rooms from your own shops"
      );
    }
  }

  // Helper method to verify if an owner owns a shop
  private async verifyOwnerOwnsShop(
    shopId: string,
    ownerId: string
  ): Promise<void> {
    const ownerShops =
      await this.reservationRepository.findAllReservationsByOwnerId(ownerId);
    const ownerShopIds = [...new Set(ownerShops.map((r) => r.room.shop.id))];

    if (!ownerShopIds.includes(shopId)) {
      throw new ForbiddenException("You can only access your own shops");
    }
  }

  // Helper method to validate time slots against shop operating hours
  private async validateTimeSlots(
    roomId: string,
    timeSlots: string[]
  ): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }

    const shop = await this.shopRepository.findById(room.shopId);
    if (!shop) {
      throw new NotFoundException("Shop not found");
    }

    // Parse time strings to minutes for comparison
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const openingMinutes = parseTime(shop.openingTime);
    const closingMinutes = parseTime(shop.closingTime);

    // Validate each time slot
    for (const timeSlot of timeSlots) {
      const slotMinutes = parseTime(timeSlot);

      if (slotMinutes < openingMinutes || slotMinutes >= closingMinutes) {
        throw new BadRequestException(
          `Time slot ${timeSlot} is outside shop operating hours (${shop.openingTime} - ${shop.closingTime})`
        );
      }
    }
  }

  // Helper method to validate that room is not disabled during the reservation period
  private async validateRoomNotDisabled(
    roomId: string,
    date: Date,
    timeSlots: string[]
  ): Promise<void> {
    // For each time slot, check if the room is disabled
    for (const timeSlot of timeSlots) {
      const [hours, minutes] = timeSlot.split(":").map(Number);
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hours, minutes, 0, 0);

      const isDisabled = await this.roomDisablePeriodService.isRoomDisabledAt(
        roomId,
        slotDateTime
      );
      if (isDisabled) {
        throw new BadRequestException(
          `Room is disabled at time slot ${timeSlot} on ${date.toDateString()}`
        );
      }
    }
  }

  async create(
    createReservationDto: CreateReservationDto,
    userId: string
  ): Promise<Reservation> {
    const { roomId, date, type, timeSlots } = createReservationDto;

    // Validate room exists and is available
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    if (!room.isAvailable) {
      throw new BadRequestException("Room is not available");
    }

    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Validate time slots are within shop operating hours
    await this.validateTimeSlots(roomId, timeSlots);

    // Check that room is not disabled during the requested time
    const reservationDate = new Date(date);
    await this.validateRoomNotDisabled(roomId, reservationDate, timeSlots);

    // Check for conflicting reservations
    const conflicts =
      await this.reservationRepository.findConflictingReservations(
        roomId,
        reservationDate,
        timeSlots
      );

    if (conflicts.length > 0) {
      throw new ConflictException("Time slots are already booked");
    }

    // Calculate total price
    const totalPrice = this.calculateTotalPrice(room, type, timeSlots.length);

    // Create reservation
    const reservation = await this.reservationRepository.create({
      roomId,
      userId,
      date: reservationDate,
      type,
      totalPrice,
    });

    // Create reservation slots
    const slots = await Promise.all(
      timeSlots.map((timeSlot) =>
        this.reservationSlotRepository.save({
          reservationId: reservation.id,
          timeSlot,
        })
      )
    );

    return { ...reservation, slots };
  }

  private calculateTotalPrice(
    room: any,
    type: ReservationType,
    slotCount: number
  ): number {
    let hourlyRate: number;

    switch (type) {
      case ReservationType.SINGLE:
        hourlyRate = room.singleHourlyRate;
        break;
      case ReservationType.MULTI:
        hourlyRate = room.multiHourlyRate;
        break;
      case ReservationType.OTHER:
        hourlyRate = room.otherHourlyRate;
        break;
      default:
        throw new BadRequestException("Invalid reservation type");
    }

    // Assuming each slot is 0.5 hours (30 minutes)
    return hourlyRate * (slotCount * 0.5);
  }

  async findAll() {
    return await this.reservationRepository.findAll({
      relations: ["room", "user", "slots"],
    });
  }

  async findAllPaginated(
    paginationDto: PaginationDto
  ): Promise<PaginatedResponse<Reservation>> {
    return await this.reservationRepository.findWithPagination(
      paginationDto.page,
      paginationDto.limit,
      {
        relations: ["room", "user", "slots"],
      }
    );
  }

  async findAllPaginatedWithSort(
    paginationWithSortDto: PaginationWithSortDto
  ): Promise<PaginatedResponse<Reservation>> {
    const { page, limit, sortBy, sortOrder } = paginationWithSortDto;
    return await this.reservationRepository.findWithPaginationAndSort(
      { page, limit },
      {
        relations: ["room", "user", "slots"],
      },
      { sortBy, sortOrder }
    );
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    return reservation;
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findByUserId(userId);
  }

  async findByUserPaginated(
    userId: string,
    paginationDto: PaginationDto
  ): Promise<PaginatedResponse<Reservation>> {
    return await this.reservationRepository.findWithPagination(
      paginationDto.page,
      paginationDto.limit,
      {
        where: { userId },
        relations: ["room", "slots"],
        order: { createdAt: "DESC" },
      }
    );
  }

  async findByUserPaginatedWithSort(
    userId: string,
    paginationWithSortDto: PaginationWithSortDto
  ): Promise<PaginatedResponse<Reservation>> {
    const { page, limit, sortBy, sortOrder } = paginationWithSortDto;
    return await this.reservationRepository.findWithPaginationAndSort(
      { page, limit },
      {
        where: { userId },
        relations: ["room", "slots"],
      },
      { sortBy, sortOrder }
    );
  }

  async findByUserWithSearchPaginatedWithSort(
    userId: string,
    paginationWithSortAndSearchDto: PaginationWithSortAndSearchDto
  ): Promise<PaginatedResponse<Reservation>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', search } = paginationWithSortAndSearchDto;
    
    const { data, total } = await this.reservationRepository.findByUserWithSearchAndPagination(
      userId,
      page,
      limit,
      search,
      sortBy,
      sortOrder
    );

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: "My reservations retrieved successfully",
      data,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  async findByRoom(roomId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findByRoomId(roomId);
  }

  async findByRoomForOwner(
    roomId: string,
    ownerId: string
  ): Promise<Reservation[]> {
    await this.verifyOwnerOwnsRoom(roomId, ownerId);
    return await this.reservationRepository.findByRoomId(roomId);
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Reservation[]> {
    return await this.reservationRepository.findByDateRange(
      new Date(startDate),
      new Date(endDate)
    );
  }

  async findByOwner(ownerId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findAllReservationsByOwnerId(
      ownerId
    );
  }

  async findByOwnerPaginated(
    ownerId: string,
    paginationDto: PaginationDto,
    shopId?: string
  ): Promise<PaginatedResponse<Reservation>> {
    // Get all reservations for the owner's shops
    let ownerReservations =
      await this.reservationRepository.findAllReservationsByOwnerId(ownerId);

    // Filter by shopId if provided
    if (shopId) {
      // Verify the owner owns this shop
      await this.verifyOwnerOwnsShop(shopId, ownerId);
      
      // Filter reservations to only include those from the specified shop
      ownerReservations = ownerReservations.filter(
        (reservation) => reservation.room.shop.id === shopId
      );
    }

    const reservationIds = ownerReservations.map((r) => r.id);

    if (reservationIds.length === 0) {
      return {
        success: true,
        message: "Owner reservations retrieved successfully",
        data: [],
        pagination: {
          page: paginationDto.page || 1,
          limit: paginationDto.limit || 10,
          total: 0,
          pages: 0,
        },
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
    }

    return await this.reservationRepository.findWithPagination(
      paginationDto.page,
      paginationDto.limit,
      {
        where: { id: In(reservationIds) },
        relations: ["room", "user", "slots"],
        order: { createdAt: "DESC" },
      }
    );
  }

  async findByOwnerPaginatedWithSort(
    ownerId: string,
    paginationWithSortDto: PaginationWithSortDto,
    shopId?: string
  ): Promise<PaginatedResponse<Reservation>> {
    // Get all reservations for the owner's shops
    let ownerReservations =
      await this.reservationRepository.findAllReservationsByOwnerId(ownerId);

    // Filter by shopId if provided
    if (shopId) {
      // Verify the owner owns this shop
      await this.verifyOwnerOwnsShop(shopId, ownerId);
      
      // Filter reservations to only include those from the specified shop
      ownerReservations = ownerReservations.filter(
        (reservation) => reservation.room.shop.id === shopId
      );
    }

    const reservationIds = ownerReservations.map((r) => r.id);

    if (reservationIds.length === 0) {
      return {
        success: true,
        message: "Owner reservations retrieved successfully",
        data: [],
        pagination: {
          page: paginationWithSortDto.page || 1,
          limit: paginationWithSortDto.limit || 10,
          total: 0,
          pages: 0,
        },
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
    }

    const { page, limit, sortBy, sortOrder } = paginationWithSortDto;
    return await this.reservationRepository.findWithPaginationAndSort(
      { page, limit },
      {
        where: { id: In(reservationIds) },
        relations: ["room", "user", "slots"],
      },
      { sortBy, sortOrder }
    );
  }

  async findByOwnerWithSearchPaginatedWithSort(
    ownerId: string,
    paginationWithSortAndSearchDto: PaginationWithSortAndSearchDto,
    shopId?: string
  ): Promise<PaginatedResponse<Reservation>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', search } = paginationWithSortAndSearchDto;
    
    // Verify the owner owns the shop if shopId is provided
    if (shopId) {
      await this.verifyOwnerOwnsShop(shopId, ownerId);
    }

    const { data, total } = await this.reservationRepository.findByOwnerWithSearchAndPagination(
      ownerId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      shopId
    );

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: "Owner reservations retrieved successfully",
      data,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  async findByShop(shopId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findReservationsByShopId(shopId);
  }

  async findByShopForOwner(
    shopId: string,
    ownerId: string
  ): Promise<Reservation[]> {
    await this.verifyOwnerOwnsShop(shopId, ownerId);
    return await this.reservationRepository.findReservationsByShopId(shopId);
  }

  async findOneForOwner(id: string, ownerId: string): Promise<Reservation> {
    await this.verifyOwnerOwnsReservation(id, ownerId);
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    return reservation;
  }

  async remove(id: string): Promise<boolean> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }

    return await this.reservationRepository.delete(id);
  }

  async removeForOwner(id: string, ownerId: string): Promise<boolean> {
    await this.verifyOwnerOwnsReservation(id, ownerId);
    return await this.reservationRepository.delete(id);
  }
}
