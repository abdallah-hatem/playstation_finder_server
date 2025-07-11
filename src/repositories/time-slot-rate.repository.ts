import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../common/repository/base.repository';
import { TimeSlotRate } from '../entities/time-slot-rate.entity';

@Injectable()
export class TimeSlotRateRepository extends BaseRepository<TimeSlotRate> {
  constructor(
    @InjectRepository(TimeSlotRate)
    private readonly timeSlotRateRepository: Repository<TimeSlotRate>,
  ) {
    super(timeSlotRateRepository);
  }

  async findByRoomId(roomId: string): Promise<TimeSlotRate[]> {
    return await this.timeSlotRateRepository.find({
      where: { roomId },
      order: { timeSlot: 'ASC' },
    });
  }

  async findByRoomIdAndTimeSlot(roomId: string, timeSlot: string): Promise<TimeSlotRate | null> {
    return await this.timeSlotRateRepository.findOne({
      where: { roomId, timeSlot },
    });
  }

  async deleteByRoomId(roomId: string): Promise<void> {
    await this.timeSlotRateRepository.delete({ roomId });
  }

  async createMany(timeSlotRates: Partial<TimeSlotRate>[]): Promise<TimeSlotRate[]> {
    const entities = this.timeSlotRateRepository.create(timeSlotRates);
    return await this.timeSlotRateRepository.save(entities);
  }

  async updateByRoomIdAndTimeSlot(
    roomId: string, 
    timeSlot: string, 
    updateData: Partial<TimeSlotRate>
  ): Promise<TimeSlotRate | null> {
    await this.timeSlotRateRepository.update({ roomId, timeSlot }, updateData);
    return await this.findByRoomIdAndTimeSlot(roomId, timeSlot);
  }

  async deleteByRoomIdAndTimeSlot(roomId: string, timeSlot: string): Promise<boolean> {
    const result = await this.timeSlotRateRepository.delete({ roomId, timeSlot });
    return result.affected ? result.affected > 0 : false;
  }
} 