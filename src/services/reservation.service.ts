import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource } from "typeorm";
import { ReservationRepository } from "../repositories/reservation.repository";
import { RoomRepository } from "../repositories/room.repository";
import { UserRepository } from "../repositories/user.repository";
import { ShopRepository } from "../repositories/shop.repository";
import { RoomDisablePeriodService } from "./room-disable-period.service";
import { CreateReservationDto } from "../dto/create-reservation.dto";
import { Reservation } from "../entities/reservation.entity";
import { ReservationSlot } from "../entities/reservation-slot.entity";
import { ReservationType, ReservationStatus } from "../common/enums/reservation-type.enum";
import { PaginationDto, PaginationWithSortDto, PaginationWithSortAndSearchDto } from "../dto/pagination.dto";
import { ReservationFilterDto } from "../dto/reservation-filter.dto";
import { SplitReservationDto, NewReservationSlotDto } from "../dto/split-reservation.dto";
import { PaginatedResponse } from "../common/interfaces/api-response.interface";

@Injectable()
export class ReservationService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly roomRepository: RoomRepository,
    private readonly userRepository: UserRepository,
    private readonly shopRepository: ShopRepository,
    private readonly roomDisablePeriodService: RoomDisablePeriodService,
    private readonly dataSource: DataSource,
    @InjectRepository(ReservationSlot)
    private readonly reservationSlotRepository: Repository<ReservationSlot>,
    @InjectRepository(Reservation)
    private readonly repository: Repository<Reservation>
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

  // Helper method to validate that time slots are not in the past
  private validateTimeNotInPast(date: Date, timeSlots: string[]): void {
    const now = new Date();
    const reservationDate = new Date(date);
    
    // If reservation is for a future date, it's valid
    if (reservationDate.toDateString() !== now.toDateString()) {
      if (reservationDate > now) {
        return; // Future date is always valid
      } else {
        throw new BadRequestException('Cannot create reservations for past dates');
      }
    }

    // If it's today, check each time slot
    for (const timeSlot of timeSlots) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotDateTime = new Date(reservationDate);
      slotDateTime.setHours(hours, minutes, 0, 0);

      if (slotDateTime <= now) {
        throw new BadRequestException(
          `Time slot ${timeSlot} has already passed. Current time: ${now.toLocaleTimeString()}`
        );
      }
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

  // Helper method to validate that the reservation type has a valid rate
  private validateReservationTypeRate(room: any, type: ReservationType): void {
    let rate: number;
    let rateName: string;

    switch (type) {
      case ReservationType.SINGLE:
        rate = room.singleHourlyRate;
        rateName = 'single hourly rate';
        break;
      case ReservationType.MULTI:
        rate = room.multiHourlyRate;
        rateName = 'multi hourly rate';
        break;
      case ReservationType.OTHER:
        rate = room.otherHourlyRate;
        rateName = 'other hourly rate';
        break;
      default:
        throw new BadRequestException("Invalid reservation type");
    }

    // Check if rate is null, undefined, or zero
    if (!rate || rate <= 0) {
      throw new BadRequestException(
        `Cannot create ${type.toLowerCase()} reservation: ${rateName} is not set or is zero for this room`
      );
    }
  }

  // Helper method to validate reservation type based on device type
  private validateReservationTypeForDevice(room: any, type: ReservationType): void {
    const gamingDevices = ['PS5', 'PS4', 'PS3', 'Xbox One'];
    const deviceName = room.device?.name;

    if (!deviceName) {
      throw new BadRequestException("Room must have a device assigned");
    }

    const isGamingDevice = gamingDevices.includes(deviceName);

    if (isGamingDevice) {
      // Gaming devices: only allow SINGLE or MULTI
      if (type === ReservationType.OTHER) {
        throw new BadRequestException(
          `Cannot create "other" reservation for gaming device "${deviceName}". Please select "single" or "multi" reservation type.`
        );
      }
    } else {
      // Non-gaming devices (like beIN Sports): only allow OTHER
      if (type === ReservationType.SINGLE || type === ReservationType.MULTI) {
        throw new BadRequestException(
          `Cannot create "${type.toLowerCase()}" reservation for non-gaming device "${deviceName}". Please select "other" reservation type.`
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

    // Validate that the reservation type has a valid rate
    this.validateReservationTypeRate(room, type);

    // Validate that the reservation type matches the device type
    this.validateReservationTypeForDevice(room, type);

    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Validate time slots are not in the past
    this.validateTimeNotInPast(new Date(date), timeSlots);

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
    const result = await this.reservationRepository.findWithPaginationAndSort(
      { page, limit },
      {
        relations: ["room", "user", "slots"],
      },
      { sortBy, sortOrder }
    );

    // Auto-update statuses based on time before returning
    const updatedData = await Promise.all(
      result.data.map(async (reservation) => {
        if (reservation.status === ReservationStatus.PENDING || reservation.status === ReservationStatus.IN_PROGRESS) {
          return await this.updateReservationStatusBasedOnTime(reservation);
        }
        return reservation;
      })
    );

    return {
      ...result,
      data: updatedData,
    };
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
    reservationFilterDto: ReservationFilterDto,
    shopId?: string
  ): Promise<PaginatedResponse<Reservation>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = reservationFilterDto;
    
    const { data, total } = await this.reservationRepository.findByUserWithSearchAndPagination(
      userId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      status,
      shopId
    );

    // Auto-update statuses based on time before returning
    const updatedData = await Promise.all(
      data.map(async (reservation) => {
        if (reservation.status === ReservationStatus.PENDING || reservation.status === ReservationStatus.IN_PROGRESS) {
          return await this.updateReservationStatusBasedOnTime(reservation);
        }
        return reservation;
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: "My reservations retrieved successfully",
      data: updatedData,
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
    reservationFilterDto: ReservationFilterDto,
    shopId?: string
  ): Promise<PaginatedResponse<Reservation>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = reservationFilterDto;
    
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
      shopId,
      status
    );

    // Auto-update statuses based on time before returning
    const updatedData = await Promise.all(
      data.map(async (reservation) => {
        if (reservation.status === ReservationStatus.PENDING || reservation.status === ReservationStatus.IN_PROGRESS) {
          return await this.updateReservationStatusBasedOnTime(reservation);
        }
        return reservation;
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: "Owner reservations retrieved successfully",
      data: updatedData,
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

  /**
   * Check if a time slot is currently active
   */
  private isTimeSlotActive(reservation: Reservation, currentDateTime: Date): boolean {
    if (!reservation.slots || reservation.slots.length === 0) {
      return false;
    }

    const reservationDate = new Date(reservation.date);
    const currentDate = new Date(currentDateTime);
    
    // Check if it's the same date
    if (reservationDate.toDateString() !== currentDate.toDateString()) {
      console.log('❌ Different dates:', reservationDate.toDateString(), 'vs', currentDate.toDateString());
      return false;
    }

    // Get the earliest and latest time slots
    const timeSlots = reservation.slots.map(slot => slot.timeSlot).sort();
    const earliestSlot = timeSlots[0];
    const latestSlot = timeSlots[timeSlots.length - 1];

    // Parse time slots (format: "HH:mm")
    const [earliestHour, earliestMinute] = earliestSlot.split(':').map(Number);
    const [latestHour, latestMinute] = latestSlot.split(':').map(Number);

    // Create start and end times for the reservation
    const startTime = new Date(reservationDate);
    startTime.setHours(earliestHour, earliestMinute, 0, 0);

    const endTime = new Date(reservationDate);
    endTime.setHours(latestHour, latestMinute + 30, 0, 0); // Add 30 minutes to the last slot

    console.log('⏰ Time Range:', startTime.toLocaleString(), '-', endTime.toLocaleString());
    console.log('🕐 Current:', currentDateTime.toLocaleString());
    console.log('📊 Is Active?', currentDateTime >= startTime && currentDateTime <= endTime);

    return currentDateTime >= startTime && currentDateTime <= endTime;
  }

  /**
   * Check if a time slot has finished
   */
  private isTimeSlotFinished(reservation: Reservation, currentDateTime: Date): boolean {
    if (!reservation.slots || reservation.slots.length === 0) {
      return false;
    }

    const reservationDate = new Date(reservation.date);
    const currentDate = new Date(currentDateTime);
    
    // If it's a past date, it's definitely finished
    if (reservationDate.toDateString() < currentDate.toDateString()) {
      console.log('✅ Past date - finished');
      return true;
    }

    // If it's a future date, it's not finished
    if (reservationDate.toDateString() > currentDate.toDateString()) {
      console.log('⏳ Future date - not finished');
      return false;
    }

    // Same date - check time
    const timeSlots = reservation.slots.map(slot => slot.timeSlot).sort();
    const latestSlot = timeSlots[timeSlots.length - 1];

    const [latestHour, latestMinute] = latestSlot.split(':').map(Number);
    const endTime = new Date(reservationDate);
    endTime.setHours(latestHour, latestMinute + 30, 0, 0); // Add 30 minutes to the last slot

    console.log('🏁 End Time:', endTime.toLocaleString());
    console.log('🕐 Current:', currentDateTime.toLocaleString());
    console.log('📊 Is Finished?', currentDateTime > endTime);

    return currentDateTime > endTime;
  }

  /**
   * Automatically update reservation status based on time
   */
  async updateReservationStatusBasedOnTime(reservation: Reservation): Promise<Reservation> {
    const currentDateTime = new Date();
    let newStatus = reservation.status;

    // Debug logging
    console.log('🔍 Status Check for Reservation:', reservation.id);
    console.log('📅 Current Time:', currentDateTime.toISOString(), '(Local:', currentDateTime.toLocaleString(), ')');
    console.log('📅 Reservation Date:', reservation.date);
    console.log('⏰ Time Slots:', reservation.slots?.map(s => s.timeSlot));
    console.log('📊 Current Status:', reservation.status);

    // Only update if currently PENDING or IN_PROGRESS
    if (reservation.status === ReservationStatus.PENDING) {
      if (this.isTimeSlotFinished(reservation, currentDateTime)) {
        newStatus = ReservationStatus.COMPLETED;
        console.log('✅ PENDING → COMPLETED (time finished)');
      } else if (this.isTimeSlotActive(reservation, currentDateTime)) {
        newStatus = ReservationStatus.IN_PROGRESS;
        console.log('▶️ PENDING → IN_PROGRESS (time active)');
      }
    } else if (reservation.status === ReservationStatus.IN_PROGRESS) {
      if (this.isTimeSlotFinished(reservation, currentDateTime)) {
        newStatus = ReservationStatus.COMPLETED;
        console.log('✅ IN_PROGRESS → COMPLETED (time finished)');
      }
    }

    // Update if status changed
    if (newStatus !== reservation.status) {
      console.log('💾 Updating status in database:', newStatus);
      await this.repository.update(reservation.id, { status: newStatus });
      reservation.status = newStatus;
    } else {
      console.log('⏸️ No status change needed');
    }

    return reservation;
  }

  /**
   * Split an in-progress reservation into multiple new reservations
   * Only allowed when reservation status is IN_PROGRESS
   */
  async splitInProgressReservation(
    reservationId: string,
    ownerId: string,
    splitDto: SplitReservationDto
  ): Promise<{ originalReservation: Reservation; newReservations: Reservation[] }> {
    // Find the original reservation with all relations
    const originalReservation = await this.repository.findOne({
      where: { id: reservationId },
      relations: ['room', 'room.shop', 'room.device', 'slots', 'user'],
    });

    if (!originalReservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Verify owner owns the shop
    if (originalReservation.room.shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only modify reservations in your own shops');
    }

    // Check if reservation is in progress
    if (originalReservation.status !== ReservationStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only split reservations that are currently in progress');
    }

    // Get current time and reservation slots
    const currentTime = new Date();
    const allSlots = originalReservation.slots.map(slot => slot.timeSlot).sort();
    
    // Find slots that haven't started yet (future slots only)
    // A slot is "future" if current time is before the slot start time
    const remainingSlots = allSlots.filter(slot => {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotStartTime = new Date(originalReservation.date);
      slotStartTime.setHours(slotHour, slotMinute, 0, 0);
      
      return currentTime < slotStartTime; // Only slots that haven't started yet
    });

    if (remainingSlots.length === 0) {
      throw new BadRequestException('No remaining time slots to split');
    }

    if (remainingSlots.length < 2) {
      throw new BadRequestException('Need at least 2 remaining slots to split');
    }

    // Validate each new reservation has at least 1 slot
    for (const newRes of splitDto.newReservations) {
      if (newRes.slotCount < 1) {
        throw new BadRequestException('Each new reservation must have at least 1 slot');
      }
    }

    // Validate that the total slots in split equals remaining slots
    const totalSplitSlots = splitDto.newReservations.reduce((sum, res) => sum + res.slotCount, 0);
    if (totalSplitSlots !== remainingSlots.length) {
      throw new BadRequestException(
        `Total slots in split (${totalSplitSlots}) must equal remaining slots (${remainingSlots.length})`
      );
    }

    // Validate minimum of 2 new reservations for a meaningful split
    if (splitDto.newReservations.length < 2) {
      throw new BadRequestException('Split operation requires at least 2 new reservations');
    }

    // Validate reservation types are compatible with device
    const deviceType = originalReservation.room.device.name.toLowerCase();
    const isGamingDevice = ['ps4', 'ps5', 'xbox'].some(gaming => deviceType.includes(gaming));

    for (const newRes of splitDto.newReservations) {
      if (isGamingDevice && newRes.type === ReservationType.OTHER) {
        throw new BadRequestException(`Gaming devices cannot use reservation type 'other'`);
      }
      if (!isGamingDevice && (newRes.type === ReservationType.SINGLE || newRes.type === ReservationType.MULTI)) {
        throw new BadRequestException(`Non-gaming devices can only use reservation type 'other'`);
      }
    }

    // Validate rates exist for the reservation types
    for (const newRes of splitDto.newReservations) {
      this.validateReservationTypeRate(originalReservation.room, newRes.type);
    }

    // Create new reservations
    const newReservations: Reservation[] = [];
    let slotIndex = 0;

    await this.dataSource.transaction(async (manager) => {
      // Find consumed slots (slots that have started or finished)
      const consumedSlots = allSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotStartTime = new Date(originalReservation.date);
        slotStartTime.setHours(slotHour, slotMinute, 0, 0);
        
        return currentTime >= slotStartTime; // Slots that have started
      });

      // Handle case where no slots have been consumed yet
      if (consumedSlots.length === 0) {
        throw new BadRequestException('Cannot split reservation before it has started. Wait until at least one time slot has begun.');
      }
      
      // Remove remaining slots from original reservation
      await manager.delete(ReservationSlot, {
        reservationId: reservationId,
        timeSlot: In(remainingSlots)
      });

      // Update original reservation status and price based on consumed slots only
      const consumedPrice = this.calculateTotalPrice(originalReservation.room, originalReservation.type, consumedSlots.length);
      await manager.update(Reservation, reservationId, { 
        status: ReservationStatus.COMPLETED,
        totalPrice: consumedPrice
      });

      // Create new reservations for remaining slots
      for (const newResDto of splitDto.newReservations) {
        const assignedSlots = remainingSlots.slice(slotIndex, slotIndex + newResDto.slotCount);
        slotIndex += newResDto.slotCount;

        // Calculate price for this reservation
        const totalPrice = this.calculateTotalPrice(originalReservation.room, newResDto.type, newResDto.slotCount);

        // Create new reservation
        const newReservation = manager.create(Reservation, {
          userId: originalReservation.userId,
          roomId: originalReservation.roomId,
          date: originalReservation.date,
          type: newResDto.type,
          totalPrice,
          status: ReservationStatus.IN_PROGRESS, // Continue as in progress
        });

        const savedReservation = await manager.save(newReservation);

        // Create reservation slots
        const reservationSlots = assignedSlots.map(timeSlot => 
          manager.create(ReservationSlot, {
            reservationId: savedReservation.id,
            timeSlot,
          })
        );

        await manager.save(ReservationSlot, reservationSlots);

        // Load the complete reservation with relations
        const completeReservation = await manager.findOne(Reservation, {
          where: { id: savedReservation.id },
          relations: ['room', 'room.shop', 'room.device', 'slots', 'user'],
        });

        newReservations.push(completeReservation);
      }
    });

    // Update original reservation status
    originalReservation.status = ReservationStatus.COMPLETED;

    return {
      originalReservation,
      newReservations,
    };
  }

  /**
   * Get remaining slots for an in-progress reservation
   */
  async getRemainingSlots(reservationId: string, ownerId: string): Promise<{
    reservationId: string;
    currentStatus: ReservationStatus;
    allSlots: string[];
    consumedSlots: string[];
    remainingSlots: string[];
    canSplit: boolean;
    splitRequirements: {
      hasStarted: boolean;
      hasRemainingSlots: boolean;
      isInProgress: boolean;
    };
  }> {
    // Find the reservation with all relations
    const reservation = await this.repository.findOne({
      where: { id: reservationId },
      relations: ['room', 'room.shop', 'slots'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Verify owner owns the shop
    if (reservation.room.shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only view reservations in your own shops');
    }

    const allSlots = reservation.slots.map(slot => slot.timeSlot).sort();
    
    // Get current time and calculate remaining slots
    const currentTime = new Date();
    
    // Find slots that haven't started yet (consistent with split logic)
    const remainingSlots = allSlots.filter(slot => {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotStartTime = new Date(reservation.date);
      slotStartTime.setHours(slotHour, slotMinute, 0, 0);
      
      return currentTime < slotStartTime; // Only slots that haven't started yet
    });
    
    // Find consumed slots
    const consumedSlots = allSlots.filter(slot => {
      const [slotHour, slotMinute] = slot.split(':').map(Number);
      const slotStartTime = new Date(reservation.date);
      slotStartTime.setHours(slotHour, slotMinute, 0, 0);
      
      return currentTime >= slotStartTime; // Slots that have started
    });
    
    const canSplit = reservation.status === ReservationStatus.IN_PROGRESS && 
                     remainingSlots.length >= 2 && 
                     consumedSlots.length > 0;

    return {
      reservationId,
      currentStatus: reservation.status,
      allSlots,
      consumedSlots,
      remainingSlots,
      canSplit,
      splitRequirements: {
        hasStarted: consumedSlots.length > 0,
        hasRemainingSlots: remainingSlots.length >= 2,
        isInProgress: reservation.status === ReservationStatus.IN_PROGRESS,
      }
    };
  }


}
