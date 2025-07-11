import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomRepository } from '../repositories/room.repository';
import { ShopRepository } from '../repositories/shop.repository';
import { TimeSlotRateService } from './time-slot-rate.service';
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
    private readonly timeSlotRateService: TimeSlotRateService,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  // Helper method to parse time strings to minutes for comparison
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

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

    // Create the room
    const room = await this.roomRepository.create({
      ...roomData,
      shopId,
      deviceId,
    });

    // Automatically generate time slot rates with the default rates from the room
    const defaultRates = {
      singleHourlyRate: room.singleHourlyRate,
      multiHourlyRate: room.multiHourlyRate,
      otherHourlyRate: room.otherHourlyRate,
    };

    // Generate time slots from 00:00 to 23:30 with the default rates
    await this.timeSlotRateService.generateDefaultTimeSlots(room.id, defaultRates);

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

  async findOneWithTimeSlotRates(id: string): Promise<Room & { timeSlotRates: any[] }> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Get time slot rates for this room
    const timeSlotRates = await this.timeSlotRateService.getTimeSlotRatesByRoom(id);

    return {
      ...room,
      timeSlotRates,
    };
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

    // Update the room first
    const updatedRoom = await this.roomRepository.update(id, updateData);

    // Check if any of the default rates were updated
    const ratesChanged = 
      updateData.singleHourlyRate !== undefined ||
      updateData.multiHourlyRate !== undefined ||
      updateData.otherHourlyRate !== undefined;

    if (ratesChanged && updatedRoom) {
      // Get all existing time slot rates for this room
      const existingTimeSlots = await this.timeSlotRateService.getTimeSlotRatesByRoom(id);

      if (existingTimeSlots.length > 0) {
        // Prepare the new default rates (use new values if provided, otherwise keep existing)
        const newDefaultRates = {
          singleHourlyRate: updateData.singleHourlyRate !== undefined 
            ? updateData.singleHourlyRate 
            : updatedRoom.singleHourlyRate,
          multiHourlyRate: updateData.multiHourlyRate !== undefined 
            ? updateData.multiHourlyRate 
            : updatedRoom.multiHourlyRate,
          otherHourlyRate: updateData.otherHourlyRate !== undefined 
            ? updateData.otherHourlyRate 
            : updatedRoom.otherHourlyRate,
        };

        // Create batch update data for all existing time slots
        const batchUpdateData = {
          roomId: id,
          timeSlotRates: existingTimeSlots.map(slot => ({
            timeSlot: slot.timeSlot,
            ...newDefaultRates,
          })),
        };

        // Update all time slot rates with the new default rates
        await this.timeSlotRateService.batchCreateTimeSlotRates(batchUpdateData);
      }
    }

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

    // Get the shop to check operating hours
    const shop = await this.shopRepository.findById(room.shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
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

    // Generate all possible time slots (00:00 to 23:30 in 30-minute intervals - full day)
    const allTimeSlots: string[] = [];
    for (let hour = 0; hour <= 23; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) {
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }

    // Filter slots based on shop operating hours
    const operatingHoursSlots = allTimeSlots.filter(slot => {
      const slotMinutes = this.parseTime(slot);
      return slotMinutes >= this.parseTime(shop.openingTime) && slotMinutes < this.parseTime(shop.closingTime);
    });

    // Calculate available slots (within operating hours and not reserved)
    const availableSlots = operatingHoursSlots.filter(slot => !reservedSlots.includes(slot));

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
        shop: {
          id: shop.id,
          name: shop.name,
          openingTime: shop.openingTime,
          closingTime: shop.closingTime,
        },
      } as Room,
      reservedSlots: reservedSlots.sort(),
      availableSlots: availableSlots.sort(),
    };
  }

  async getTimeSlotRatesWithinOperatingHours(roomId: string): Promise<{ room: Room; shop: any; timeSlotRates: any[] }> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Get the shop to check operating hours
    const shop = await this.shopRepository.findById(room.shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Get all time slot rates for this room
    const allTimeSlotRates = await this.timeSlotRateService.getTimeSlotRatesByRoom(roomId);

    // Filter time slot rates based on shop operating hours
    const operatingHoursRates = allTimeSlotRates.filter(rate => {
      const slotMinutes = this.parseTime(rate.timeSlot);
      return slotMinutes >= this.parseTime(shop.openingTime) && slotMinutes < this.parseTime(shop.closingTime);
    });

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
      shop: {
        id: shop.id,
        name: shop.name,
        openingTime: shop.openingTime,
        closingTime: shop.closingTime,
      },
      timeSlotRates: operatingHoursRates.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
    };
  }
} 