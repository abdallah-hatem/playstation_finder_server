import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class ReservationRepository extends BaseRepository<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {
    super(reservationRepository);
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { userId },
      relations: ['room', 'room.shop', 'slots'],
    });
  }

  async findByRoomId(roomId: string): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { roomId },
      relations: ['user', 'slots'],
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Reservation[]> {
    return await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.slots', 'slots')
      .where('reservation.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();
  }

  async findConflictingReservations(
    roomId: string,
    date: Date,
    timeSlots: string[],
  ): Promise<Reservation[]> {
    return await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.slots', 'slots')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.date = :date', { date })
      .andWhere('slots.timeSlot IN (:...timeSlots)', { timeSlots })
      .getMany();
  }
} 