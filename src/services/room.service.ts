import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomRepository } from '../repositories/room.repository';
import { ShopRepository } from '../repositories/shop.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { Room } from '../entities/room.entity';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly shopRepository: ShopRepository,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const { shopId, deviceId, ...roomData } = createRoomDto;

    // Validate shop exists
    const shop = await this.shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Validate device exists
    const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const room = await this.roomRepository.create({
      ...roomData,
      shopId,
      deviceId,
    });

    return room;
  }

  async findAll() {
    return await this.roomRepository.findAll({
      relations: ['shop', 'device'],
    });
  }

  async findByOwner(ownerId: string) {
    return await this.roomRepository.findByOwnerId(ownerId);
  }

  async findOneById(id: string): Promise<Room> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async findByShop(shopId: string, startDate?: string, endDate?: string): Promise<Room[]> {
    // Validate shop exists
    const shop = await this.shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // If date range is provided, use it; otherwise get rooms with future reservations
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return await this.roomRepository.findByShopIdWithDateRange(shopId, start, end);
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return await this.roomRepository.findByShopIdWithDateRange(shopId, start, end);
    // return await this.roomRepository.findByShopId(shopId);
  }

  async findAvailable(shopId?: string): Promise<Room[]> {
    return await this.roomRepository.findAvailableRooms(shopId);
  }

  async findByDevice(deviceId: string): Promise<Room[]> {
    // Validate device exists
    const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return await this.roomRepository.findByDeviceId(deviceId);
  }

  async update(id: string, updateData: Partial<CreateRoomDto>): Promise<Room> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (updateData.shopId) {
      const shop = await this.shopRepository.findById(updateData.shopId);
      if (!shop) {
        throw new NotFoundException('Shop not found');
      }
    }

    if (updateData.deviceId) {
      const device = await this.deviceRepository.findOne({ where: { id: updateData.deviceId } });
      if (!device) {
        throw new NotFoundException('Device not found');
      }
    }

    const updatedRoom = await this.roomRepository.update(id, updateData);
    return updatedRoom!;
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<Room> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const updatedRoom = await this.roomRepository.update(id, { isAvailable });
    return updatedRoom!;
  }

  async remove(id: string): Promise<boolean> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return await this.roomRepository.delete(id);
  }

  async getAvailableTimeSlots(roomId: string, date: string): Promise<{ room: Room; reservedSlots: string[]; availableSlots: string[] }> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Get reservations for the specific date
    const targetDate = new Date(date);
    const reservedSlots: string[] = [];

    if (room.reservations) {
      room.reservations.forEach(reservation => {
        const reservationDate = new Date(reservation.date);
        if (reservationDate.toDateString() === targetDate.toDateString()) {
          reservation.slots.forEach(slot => {
            reservedSlots.push(slot.timeSlot);
          });
        }
      });
    }

    // Generate all possible time slots (example: 9:00 to 22:00 in 30-minute intervals)
    const allTimeSlots: string[] = [];
    for (let hour = 9; hour <= 22; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) {
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }

    // Calculate available slots
    const availableSlots = allTimeSlots.filter(slot => !reservedSlots.includes(slot));

    return {
      room: {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        device: room.device,
        singleHourlyRate: room.singleHourlyRate,
        multiHourlyRate: room.multiHourlyRate,
        otherHourlyRate: room.otherHourlyRate,
        isAvailable: room.isAvailable,
      } as Room,
      reservedSlots: reservedSlots.sort(),
      availableSlots: availableSlots.sort(),
    };
  }
} 