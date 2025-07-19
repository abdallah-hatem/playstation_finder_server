import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationRepository } from '../repositories/reservation.repository';
import { ReservationStatus } from '../common/enums/reservation-type.enum';
import { Reservation } from '../entities/reservation.entity';

@Injectable()
export class ReservationStatusService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    @InjectRepository(Reservation)
    private readonly repository: Repository<Reservation>,
  ) {}

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
    if (reservationDate < currentDate) {
      return true;
    }

    // If it's a future date, it's not finished
    if (reservationDate > currentDate) {
      return false;
    }

    // Same date - check time
    const timeSlots = reservation.slots.map(slot => slot.timeSlot).sort();
    const latestSlot = timeSlots[timeSlots.length - 1];

    const [latestHour, latestMinute] = latestSlot.split(':').map(Number);
    const endTime = new Date(reservationDate);
    endTime.setHours(latestHour, latestMinute + 30, 0, 0); // Add 30 minutes to the last slot

    return currentDateTime > endTime;
  }

  /**
   * Automatically update reservation status based on time
   */
  async updateReservationStatusBasedOnTime(reservationId: string): Promise<Reservation> {
    const reservation = await this.repository
      .findOne({
        where: { id: reservationId },
        relations: ['slots'],
      });

    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }

    const currentDateTime = new Date();
    let newStatus = reservation.status;

    // Only update if currently PENDING or IN_PROGRESS
    if (reservation.status === ReservationStatus.PENDING) {
      if (this.isTimeSlotActive(reservation, currentDateTime)) {
        newStatus = ReservationStatus.IN_PROGRESS;
      }
    } else if (reservation.status === ReservationStatus.IN_PROGRESS) {
      if (this.isTimeSlotFinished(reservation, currentDateTime)) {
        newStatus = ReservationStatus.COMPLETED;
      }
    }

    // Update if status changed
    if (newStatus !== reservation.status) {
      await this.repository.update(reservationId, { status: newStatus });
      reservation.status = newStatus;
    }

    return reservation;
  }

  /**
   * Update multiple reservations' statuses based on time
   */
  async updateAllReservationsStatusBasedOnTime(): Promise<void> {
    const currentDateTime = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all reservations that are PENDING or IN_PROGRESS for today and past dates
    const reservations = await this.repository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.slots', 'slots')
      .where('reservation.status IN (:...statuses)', { 
        statuses: [ReservationStatus.PENDING, ReservationStatus.IN_PROGRESS] 
      })
      .andWhere('reservation.date <= :today', { today })
      .getMany();

    for (const reservation of reservations) {
      await this.updateReservationStatusBasedOnTime(reservation.id);
    }
  }

  /**
   * Validate if owner can update reservation status
   */
  private validateOwnerStatusTransition(currentStatus: ReservationStatus, newStatus: ReservationStatus, reservation: Reservation): void {
    const currentDateTime = new Date();

    switch (newStatus) {
      case ReservationStatus.PENDING:
        // Can only set to PENDING if it's in the future
        if (this.isTimeSlotActive(reservation, currentDateTime) || this.isTimeSlotFinished(reservation, currentDateTime)) {
          throw new BadRequestException('Cannot set status to PENDING for active or finished reservations');
        }
        break;

      case ReservationStatus.IN_PROGRESS:
        // Can only set to IN_PROGRESS if the time slot is currently active
        if (!this.isTimeSlotActive(reservation, currentDateTime)) {
          throw new BadRequestException('Cannot set status to IN_PROGRESS outside of reservation time slot');
        }
        // Must be coming from PENDING
        if (currentStatus !== ReservationStatus.PENDING) {
          throw new BadRequestException('Can only set to IN_PROGRESS from PENDING status');
        }
        break;

      case ReservationStatus.NO_SHOW:
        // Can only set to NO_SHOW if it was IN_PROGRESS or if the time has passed
        if (currentStatus !== ReservationStatus.IN_PROGRESS && !this.isTimeSlotFinished(reservation, currentDateTime)) {
          throw new BadRequestException('Can only set to NO_SHOW for reservations that were IN_PROGRESS or have finished');
        }
        break;

      case ReservationStatus.COMPLETED:
        // Can set to COMPLETED from IN_PROGRESS or if time has finished
        if (currentStatus === ReservationStatus.PENDING && !this.isTimeSlotFinished(reservation, currentDateTime)) {
          throw new BadRequestException('Cannot mark as COMPLETED before the reservation time has finished');
        }
        break;

      case ReservationStatus.PAYMENT_SUCCESS:
        // Can set payment success from any status (for payment processing)
        break;

      default:
        throw new BadRequestException('Invalid status transition');
    }
  }

  /**
   * Update reservation status by owner with validation
   */
  async updateReservationStatusByOwner(reservationId: string, newStatus: ReservationStatus, ownerId: string): Promise<Reservation> {
    const reservation = await this.repository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.slots', 'slots')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('room.shop', 'shop')
      .where('reservation.id = :reservationId', { reservationId })
      .getOne();

    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }

    // Verify owner owns the shop
    if (reservation.room.shop.ownerId !== ownerId) {
      throw new BadRequestException('You can only update reservations for your own shops');
    }

    // Validate status transition
    this.validateOwnerStatusTransition(reservation.status, newStatus, reservation);

    // Update status
    await this.repository.update(reservationId, { status: newStatus });
    reservation.status = newStatus;

    return reservation;
  }

  /**
   * Get valid status transitions for a reservation
   */
  async getValidStatusTransitions(reservationId: string, ownerId: string): Promise<ReservationStatus[]> {
    const reservation = await this.repository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.slots', 'slots')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('room.shop', 'shop')
      .where('reservation.id = :reservationId', { reservationId })
      .getOne();

    if (!reservation) {
      return [];
    }

    // Verify owner owns the shop
    if (reservation.room.shop.ownerId !== ownerId) {
      return [];
    }

    const currentDateTime = new Date();
    const validStatuses: ReservationStatus[] = [];
    const currentStatus = reservation.status;

    // Check each possible status
    try {
      this.validateOwnerStatusTransition(currentStatus, ReservationStatus.PENDING, reservation);
      validStatuses.push(ReservationStatus.PENDING);
    } catch (e) {}

    try {
      this.validateOwnerStatusTransition(currentStatus, ReservationStatus.IN_PROGRESS, reservation);
      validStatuses.push(ReservationStatus.IN_PROGRESS);
    } catch (e) {}

    try {
      this.validateOwnerStatusTransition(currentStatus, ReservationStatus.NO_SHOW, reservation);
      validStatuses.push(ReservationStatus.NO_SHOW);
    } catch (e) {}

    try {
      this.validateOwnerStatusTransition(currentStatus, ReservationStatus.COMPLETED, reservation);
      validStatuses.push(ReservationStatus.COMPLETED);
    } catch (e) {}

    try {
      this.validateOwnerStatusTransition(currentStatus, ReservationStatus.PAYMENT_SUCCESS, reservation);
      validStatuses.push(ReservationStatus.PAYMENT_SUCCESS);
    } catch (e) {}

    return validStatuses.filter(status => status !== currentStatus);
  }
} 