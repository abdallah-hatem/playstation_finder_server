import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TimeSlotRateRepository } from '../repositories/time-slot-rate.repository';
import { RoomRepository } from '../repositories/room.repository';
import { CreateTimeSlotRateDto, UpdateTimeSlotRateDto, BatchCreateTimeSlotRatesDto } from '../dto/time-slot-rate.dto';
import { TimeSlotRate } from '../entities/time-slot-rate.entity';

@Injectable()
export class TimeSlotRateService {
  constructor(
    private readonly timeSlotRateRepository: TimeSlotRateRepository,
    private readonly roomRepository: RoomRepository,
  ) {}

  async createTimeSlotRate(roomId: string, createDto: CreateTimeSlotRateDto): Promise<TimeSlotRate> {
    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if time slot rate already exists for this room and time slot
    const existingRate = await this.timeSlotRateRepository.findByRoomIdAndTimeSlot(roomId, createDto.timeSlot);
    if (existingRate) {
      throw new ConflictException(`Time slot rate for ${createDto.timeSlot} already exists for this room`);
    }

    return await this.timeSlotRateRepository.create({
      roomId,
      ...createDto,
    });
  }

  async batchCreateTimeSlotRates(batchDto: BatchCreateTimeSlotRatesDto): Promise<TimeSlotRate[]> {
    const { roomId, timeSlotRates } = batchDto;

    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Delete existing rates for this room to replace them
    await this.timeSlotRateRepository.deleteByRoomId(roomId);

    // Create new rates
    const ratesData = timeSlotRates.map(rate => ({
      roomId,
      ...rate,
    }));

    return await this.timeSlotRateRepository.createMany(ratesData);
  }

  async getTimeSlotRatesByRoom(roomId: string): Promise<TimeSlotRate[]> {
    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return await this.timeSlotRateRepository.findByRoomId(roomId);
  }

  async getTimeSlotRate(roomId: string, timeSlot: string): Promise<TimeSlotRate> {
    const rate = await this.timeSlotRateRepository.findByRoomIdAndTimeSlot(roomId, timeSlot);
    if (!rate) {
      throw new NotFoundException(`Time slot rate for ${timeSlot} not found in this room`);
    }
    return rate;
  }

  async updateTimeSlotRate(roomId: string, timeSlot: string, updateDto: UpdateTimeSlotRateDto): Promise<TimeSlotRate> {
    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if time slot rate exists
    const existingRate = await this.timeSlotRateRepository.findByRoomIdAndTimeSlot(roomId, timeSlot);
    if (!existingRate) {
      throw new NotFoundException(`Time slot rate for ${timeSlot} not found in this room`);
    }

    const updatedRate = await this.timeSlotRateRepository.updateByRoomIdAndTimeSlot(roomId, timeSlot, updateDto);
    if (!updatedRate) {
      throw new NotFoundException('Failed to update time slot rate');
    }

    return updatedRate;
  }

  async deleteTimeSlotRate(roomId: string, timeSlot: string): Promise<boolean> {
    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const deleted = await this.timeSlotRateRepository.deleteByRoomIdAndTimeSlot(roomId, timeSlot);
    if (!deleted) {
      throw new NotFoundException(`Time slot rate for ${timeSlot} not found in this room`);
    }

    return deleted;
  }

  async deleteAllTimeSlotRatesForRoom(roomId: string): Promise<void> {
    // Validate room exists
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.timeSlotRateRepository.deleteByRoomId(roomId);
  }

  async generateDefaultTimeSlots(roomId: string, defaultRates?: Partial<CreateTimeSlotRateDto>): Promise<TimeSlotRate[]> {
    // Generate time slots from 00:00 to 23:30 in 30-minute intervals (full day)
    const timeSlots: string[] = [];
    
    for (let hour = 0; hour <= 23; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }

    const rates = defaultRates || {
      singleHourlyRate: null,
      multiHourlyRate: null,
      otherHourlyRate: null,
    };

    const batchDto: BatchCreateTimeSlotRatesDto = {
      roomId,
      timeSlotRates: timeSlots.map(timeSlot => ({
        timeSlot,
        ...rates,
      })),
    };

    return await this.batchCreateTimeSlotRates(batchDto);
  }
} 