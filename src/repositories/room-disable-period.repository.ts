import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../common/repository/base.repository';
import { RoomDisablePeriod } from '../entities/room-disable-period.entity';

@Injectable()
export class RoomDisablePeriodRepository extends BaseRepository<RoomDisablePeriod> {
  constructor(
    @InjectRepository(RoomDisablePeriod)
    private readonly roomDisablePeriodRepository: Repository<RoomDisablePeriod>,
  ) {
    super(roomDisablePeriodRepository);
  }

  async findByRoomId(roomId: string): Promise<RoomDisablePeriod[]> {
    return await this.roomDisablePeriodRepository.find({
      where: { roomId },
      relations: ['room', 'owner'],
      order: { startDateTime: 'ASC' },
    });
  }

  async findByOwnerId(ownerId: string): Promise<RoomDisablePeriod[]> {
    return await this.roomDisablePeriodRepository.find({
      where: { ownerId },
      relations: ['room', 'owner'],
      order: { startDateTime: 'ASC' },
    });
  }

  // Find overlapping disable periods for a room within a time range
  async findOverlappingPeriods(
    roomId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeId?: string,
  ): Promise<RoomDisablePeriod[]> {
    const queryBuilder = this.roomDisablePeriodRepository
      .createQueryBuilder('disable_period')
      .where('disable_period.roomId = :roomId', { roomId })
      .andWhere(
        '(disable_period.startDateTime < :endDateTime AND disable_period.endDateTime > :startDateTime)',
        { startDateTime, endDateTime },
      );

    if (excludeId) {
      queryBuilder.andWhere('disable_period.id != :excludeId', { excludeId });
    }

    return await queryBuilder.getMany();
  }

  // Find active disable periods for a room at a specific datetime
  async findActivePeriodsAtDateTime(roomId: string, dateTime: Date): Promise<RoomDisablePeriod[]> {
    return await this.roomDisablePeriodRepository
      .createQueryBuilder('disable_period')
      .where('disable_period.roomId = :roomId', { roomId })
      .andWhere('disable_period.startDateTime <= :dateTime', { dateTime })
      .andWhere('disable_period.endDateTime > :dateTime', { dateTime })
      .getMany();
  }

  // Find all current and future disable periods for a room
  async findCurrentAndFuturePeriodsForRoom(roomId: string): Promise<RoomDisablePeriod[]> {
    const now = new Date();
    return await this.roomDisablePeriodRepository
      .createQueryBuilder('disable_period')
      .leftJoinAndSelect('disable_period.room', 'room')
      .leftJoinAndSelect('disable_period.owner', 'owner')
      .where('disable_period.roomId = :roomId', { roomId })
      .andWhere('disable_period.endDateTime > :now', { now })
      .orderBy('disable_period.startDateTime', 'ASC')
      .getMany();
  }

  // Check if a room is disabled during a specific time period
  async isRoomDisabledDuringPeriod(
    roomId: string,
    startDateTime: Date,
    endDateTime: Date,
  ): Promise<boolean> {
    const count = await this.roomDisablePeriodRepository
      .createQueryBuilder('disable_period')
      .where('disable_period.roomId = :roomId', { roomId })
      .andWhere(
        '(disable_period.startDateTime < :endDateTime AND disable_period.endDateTime > :startDateTime)',
        { startDateTime, endDateTime },
      )
      .getCount();

    return count > 0;
  }

  // Find disable periods that will expire in the next X hours
  async findExpiringPeriods(hoursFromNow: number): Promise<RoomDisablePeriod[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);

    return await this.roomDisablePeriodRepository
      .createQueryBuilder('disable_period')
      .leftJoinAndSelect('disable_period.room', 'room')
      .leftJoinAndSelect('disable_period.owner', 'owner')
      .where('disable_period.endDateTime BETWEEN :now AND :futureTime', { now, futureTime })
      .orderBy('disable_period.endDateTime', 'ASC')
      .getMany();
  }

  // Delete expired disable periods
  async deleteExpiredPeriods(): Promise<number> {
    const now = new Date();
    const result = await this.roomDisablePeriodRepository
      .createQueryBuilder()
      .delete()
      .from(RoomDisablePeriod)
      .where('endDateTime < :now', { now })
      .execute();

    return result.affected || 0;
  }
} 