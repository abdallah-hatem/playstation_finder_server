import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { RoomDisablePeriodRepository } from '../repositories/room-disable-period.repository';
import { RoomRepository } from '../repositories/room.repository';
import { OwnerRepository } from '../repositories/owner.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { CreateRoomDisablePeriodDto } from '../dto/create-room-disable-period.dto';
import { RoomDisablePeriod } from '../entities/room-disable-period.entity';

@Injectable()
export class RoomDisablePeriodService {
  constructor(
    private readonly roomDisablePeriodRepository: RoomDisablePeriodRepository,
    private readonly roomRepository: RoomRepository,
    private readonly ownerRepository: OwnerRepository,
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async createDisablePeriod(
    roomId: string,
    ownerId: string,
    createDto: CreateRoomDisablePeriodDto,
  ): Promise<RoomDisablePeriod> {
    const { startDateTime, endDateTime, reason } = createDto;

    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Validate owner exists and owns the shop that contains this room
    const owner = await this.ownerRepository.findById(ownerId);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check if owner owns the shop that contains this room
    if (room.shop?.ownerId !== ownerId) {
      throw new ForbiddenException('You can only disable rooms in your own shop');
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    // Additional validation: check minimum duration (at least 30 minutes)
    const minimumDurationMs = 30 * 60 * 1000; // 30 minutes in milliseconds
    if (endDate.getTime() - startDate.getTime() < minimumDurationMs) {
      throw new BadRequestException('Disable period must be at least 30 minutes long');
    }

    // Check for overlapping disable periods
    const overlappingPeriods = await this.roomDisablePeriodRepository.findOverlappingPeriods(
      roomId,
      startDate,
      endDate,
    );

    if (overlappingPeriods.length > 0) {
      throw new ConflictException('The specified time period overlaps with an existing disable period');
    }

    // Check for existing reservations during this time period
    await this.validateNoExistingReservations(roomId, startDate, endDate);

    // Create the disable period
    return await this.roomDisablePeriodRepository.create({
      roomId,
      ownerId,
      startDateTime: startDate,
      endDateTime: endDate,
      reason,
    });
  }

  async getDisablePeriodsForRoom(roomId: string): Promise<RoomDisablePeriod[]> {
    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return await this.roomDisablePeriodRepository.findCurrentAndFuturePeriodsForRoom(roomId);
  }

  async getDisablePeriodsForOwner(ownerId: string): Promise<RoomDisablePeriod[]> {
    // Validate owner exists
    const owner = await this.ownerRepository.findById(ownerId);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    return await this.roomDisablePeriodRepository.findByOwnerId(ownerId);
  }

  async deleteDisablePeriod(periodId: string, ownerId: string): Promise<void> {
    const period = await this.roomDisablePeriodRepository.findById(periodId);
    if (!period) {
      throw new NotFoundException('Disable period not found');
    }

    // Check ownership
    if (period.ownerId !== ownerId) {
      throw new ForbiddenException('You can only delete your own disable periods');
    }

    await this.roomDisablePeriodRepository.delete(periodId);
  }

  async updateDisablePeriod(
    periodId: string,
    ownerId: string,
    updateDto: CreateRoomDisablePeriodDto,
  ): Promise<RoomDisablePeriod> {
    const period = await this.roomDisablePeriodRepository.findById(periodId);
    if (!period) {
      throw new NotFoundException('Disable period not found');
    }

    // Check ownership
    if (period.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own disable periods');
    }

    const { startDateTime, endDateTime, reason } = updateDto;
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    // Additional validation: check minimum duration (at least 30 minutes)
    const minimumDurationMs = 30 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() < minimumDurationMs) {
      throw new BadRequestException('Disable period must be at least 30 minutes long');
    }

    // Check for overlapping disable periods (excluding the current one)
    const overlappingPeriods = await this.roomDisablePeriodRepository.findOverlappingPeriods(
      period.roomId,
      startDate,
      endDate,
      periodId,
    );

    if (overlappingPeriods.length > 0) {
      throw new ConflictException('The specified time period overlaps with an existing disable period');
    }

    // Check for existing reservations during this time period
    await this.validateNoExistingReservations(period.roomId, startDate, endDate);

    // Update the disable period
    const updated = await this.roomDisablePeriodRepository.update(periodId, {
      startDateTime: startDate,
      endDateTime: endDate,
      reason,
    });

    return updated!;
  }

  // Helper method to check if a room is disabled at a specific date/time
  async isRoomDisabledAt(roomId: string, dateTime: Date): Promise<boolean> {
    const activePeriods = await this.roomDisablePeriodRepository.findActivePeriodsAtDateTime(roomId, dateTime);
    return activePeriods.length > 0;
  }

  // Helper method to check if a room is disabled during a time range
  async isRoomDisabledDuringPeriod(roomId: string, startDateTime: Date, endDateTime: Date): Promise<boolean> {
    return await this.roomDisablePeriodRepository.isRoomDisabledDuringPeriod(roomId, startDateTime, endDateTime);
  }

  // Cleanup expired disable periods (can be called periodically)
  async cleanupExpiredPeriods(): Promise<number> {
    return await this.roomDisablePeriodRepository.deleteExpiredPeriods();
  }

  // Get disable periods expiring soon (for notifications)
  async getExpiringPeriods(hoursFromNow: number = 24): Promise<RoomDisablePeriod[]> {
    return await this.roomDisablePeriodRepository.findExpiringPeriods(hoursFromNow);
  }

  // Helper method to validate that no existing reservations conflict with the disable period
  private async validateNoExistingReservations(roomId: string, startDateTime: Date, endDateTime: Date): Promise<void> {
    // Get the date range for checking reservations
    const startDate = new Date(startDateTime);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateTime);
    endDate.setHours(23, 59, 59, 999);

    // Get all reservations for this room within the date range
    const reservations = await this.reservationRepository.findByDateRange(startDate, endDate);
    const roomReservations = reservations.filter(r => r.roomId === roomId);

    // Check each reservation to see if any time slots conflict with the disable period
    for (const reservation of roomReservations) {
      for (const slot of reservation.slots) {
        const [hours, minutes] = slot.timeSlot.split(':').map(Number);
        const slotDateTime = new Date(reservation.date);
        slotDateTime.setHours(hours, minutes, 0, 0);

        // Check if this slot falls within the disable period
        if (slotDateTime >= startDateTime && slotDateTime < endDateTime) {
          throw new ConflictException(
            `Cannot disable room during this period. There is an existing reservation on ${reservation.date.toDateString()} at ${slot.timeSlot}`
          );
        }
      }
    }
  }
} 