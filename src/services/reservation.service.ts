import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReservationRepository } from '../repositories/reservation.repository';
import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { Reservation } from '../entities/reservation.entity';
import { ReservationSlot } from '../entities/reservation-slot.entity';
import { ReservationType } from '../common/enums/reservation-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ReservationService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly roomRepository: RoomRepository,
    private readonly userRepository: UserRepository,
    @InjectRepository(ReservationSlot)
    private readonly reservationSlotRepository: Repository<ReservationSlot>,
  ) {}

  // Helper method to verify if an owner owns a reservation
  private async verifyOwnerOwnsReservation(reservationId: string, ownerId: string): Promise<void> {
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const room = await this.roomRepository.findById(reservation.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if the room belongs to one of the owner's shops
    const ownerReservations = await this.reservationRepository.findAllReservationsByOwnerId(ownerId);
    const ownerReservationIds = ownerReservations.map(r => r.id);
    
    if (!ownerReservationIds.includes(reservationId)) {
      throw new ForbiddenException('You can only access reservations for your own rooms');
    }
  }

  // Helper method to verify if an owner owns a room
  private async verifyOwnerOwnsRoom(roomId: string, ownerId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // The findById method already includes shop relationship
    if (!room.shop || room.shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only access rooms from your own shops');
    }
  }

  // Helper method to verify if an owner owns a shop
  private async verifyOwnerOwnsShop(shopId: string, ownerId: string): Promise<void> {
    const ownerShops = await this.reservationRepository.findAllReservationsByOwnerId(ownerId);
    const ownerShopIds = [...new Set(ownerShops.map(r => r.room.shop.id))];
    
    if (!ownerShopIds.includes(shopId)) {
      throw new ForbiddenException('You can only access your own shops');
    }
  }

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<Reservation> {
    const { roomId, date, type, timeSlots } = createReservationDto;

    // Validate room exists and is available
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (!room.isAvailable) {
      throw new BadRequestException('Room is not available');
    }

    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for conflicting reservations
    const reservationDate = new Date(date);
    const conflicts = await this.reservationRepository.findConflictingReservations(
      roomId,
      reservationDate,
      timeSlots,
    );

    if (conflicts.length > 0) {
      throw new ConflictException('Time slots are already booked');
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
      timeSlots.map(timeSlot =>
        this.reservationSlotRepository.save({
          reservationId: reservation.id,
          timeSlot,
        }),
      ),
    );

    return { ...reservation, slots };
  }

  private calculateTotalPrice(room: any, type: ReservationType, slotCount: number): number {
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
        throw new BadRequestException('Invalid reservation type');
    }

    // Assuming each slot is 0.5 hours (30 minutes)
    return hourlyRate * (slotCount * 0.5);
  }

  async findAll() {
    return await this.reservationRepository.findAll({
      relations: ['room', 'user', 'slots'],
    });
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findByUserId(userId);
  }

  async findByRoom(roomId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findByRoomId(roomId);
  }

  async findByRoomForOwner(roomId: string, ownerId: string): Promise<Reservation[]> {
    await this.verifyOwnerOwnsRoom(roomId, ownerId);
    return await this.reservationRepository.findByRoomId(roomId);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Reservation[]> {
    return await this.reservationRepository.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  async findByOwner(ownerId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findAllReservationsByOwnerId(ownerId);
  }

  async findByShop(shopId: string): Promise<Reservation[]> {
    return await this.reservationRepository.findReservationsByShopId(shopId);
  }

  async findByShopForOwner(shopId: string, ownerId: string): Promise<Reservation[]> {
    await this.verifyOwnerOwnsShop(shopId, ownerId);
    return await this.reservationRepository.findReservationsByShopId(shopId);
  }

  async findOneForOwner(id: string, ownerId: string): Promise<Reservation> {
    await this.verifyOwnerOwnsReservation(id, ownerId);
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }

  async remove(id: string): Promise<boolean> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return await this.reservationRepository.delete(id);
  }

  async removeForOwner(id: string, ownerId: string): Promise<boolean> {
    await this.verifyOwnerOwnsReservation(id, ownerId);
    return await this.reservationRepository.delete(id);
  }
} 