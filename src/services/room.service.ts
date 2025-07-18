import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomRepository } from '../repositories/room.repository';
import { ShopRepository } from '../repositories/shop.repository';
import { TimeSlotRateService } from './time-slot-rate.service';
import { RoomDisablePeriodService } from './room-disable-period.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { Room } from '../entities/room.entity';
import { PaginationDto, PaginationWithSortDto } from '../dto/pagination.dto';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly shopRepository: ShopRepository,
    private readonly timeSlotRateService: TimeSlotRateService,
    private readonly roomDisablePeriodService: RoomDisablePeriodService,
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

  async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedResponse<Room>> {
    return await this.roomRepository.findWithPagination(
      paginationDto.page,
      paginationDto.limit,
      {
        relations: ['shop', 'device'],
      },
    );
  }

  async findAllPaginatedWithSort(paginationWithSortDto: PaginationWithSortDto): Promise<PaginatedResponse<Room>> {
    const { page, limit, sortBy, sortOrder } = paginationWithSortDto;
    return await this.roomRepository.findWithPaginationAndSort(
      { page, limit },
      {
        relations: ['shop', 'device'],
      },
      { sortBy, sortOrder },
    );
  }

  async findByOwner(ownerId: string) {
    return await this.roomRepository.findByOwnerId(ownerId);
  }

  async findByOwnerPaginated(ownerId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Room>> {
    return await this.roomRepository.findWithPagination(
      paginationDto.page,
      paginationDto.limit,
      {
        where: { shop: { ownerId } },
        relations: ['shop', 'device'],
      },
    );
  }

  async findByOwnerPaginatedWithSort(ownerId: string, paginationWithSortDto: PaginationWithSortDto): Promise<PaginatedResponse<Room>> {
    const { page, limit, sortBy, sortOrder } = paginationWithSortDto;
    return await this.roomRepository.findWithPaginationAndSort(
      { page, limit },
      {
        where: { shop: { ownerId } },
        relations: ['shop', 'device'],
      },
      { sortBy, sortOrder },
    );
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

  async findByShop(shopId: string, startDate?: string, endDate?: string, checkDate?: string): Promise<any[]> {
    // Validate shop exists
    const shop = await this.shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Get base room data with reservations
    let rooms: Room[];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      rooms = await this.roomRepository.findByShopIdWithDateRange(shopId, start, end);
    } else {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      rooms = await this.roomRepository.findByShopIdWithDateRange(shopId, start, end);
    }

    // Use checkDate for time slot status checking (default to today)
    const targetCheckDate = checkDate ? new Date(checkDate) : new Date();
    targetCheckDate.setHours(0, 0, 0, 0);

    // Enhance each room with time slot rates and status
    const enhancedRooms = await Promise.all(
      rooms.map(async (room) => {
        // Get time slot rates for this room within operating hours
        const timeSlotRatesData = await this.getTimeSlotRatesWithinOperatingHours(room.id);
        
        // Get reserved slots for the target date
        const reservedSlots: string[] = [];
        if (room.reservations) {
          room.reservations.forEach(reservation => {
            const reservationDate = new Date(reservation.date);
            if (reservationDate.toDateString() === targetCheckDate.toDateString()) {
              reservation.slots.forEach(slot => {
                reservedSlots.push(slot.timeSlot);
              });
            }
          });
        }

        // Enhance time slot rates with isDisabled and isBooked status
        const enhancedTimeSlotRates = await Promise.all(
          timeSlotRatesData.timeSlotRates.map(async (rate) => {
            const [hours, minutes] = rate.timeSlot.split(':').map(Number);
            const slotDateTime = new Date(targetCheckDate);
            slotDateTime.setHours(hours, minutes, 0, 0);

            // Check if disabled by owner
            const isDisabled = await this.roomDisablePeriodService.isRoomDisabledAt(room.id, slotDateTime);
            
            // Check if booked by customer
            const isBooked = reservedSlots.includes(rate.timeSlot);

            return {
              ...rate,
              isDisabled,
              isBooked,
            };
          })
        );

        return {
          ...room,
          timeSlotRates: enhancedTimeSlotRates,
        };
      })
    );

    return enhancedRooms;
  }

  async findByShopForDate(shopId: string, date?: string): Promise<any[]> {
    // Use provided date or default to today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Validate shop exists
    const shop = await this.shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Set up date range for filtering reservations (same day)
    const startDate = new Date(targetDate);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // Get rooms with reservations for the target date
    const rooms = await this.roomRepository.findByShopIdWithDateRange(shopId, startDate, endDate);

    // Enhance each room with time slot rates and status
    const enhancedRooms = await Promise.all(
      rooms.map(async (room) => {
        // Get time slot rates for this room within operating hours
        const timeSlotRatesData = await this.getTimeSlotRatesWithinOperatingHours(room.id);
        
        // Get reserved slots for the target date
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

        // Enhance time slot rates with isDisabled and isBooked status
        const enhancedTimeSlotRates = await Promise.all(
          timeSlotRatesData.timeSlotRates.map(async (rate) => {
            const [hours, minutes] = rate.timeSlot.split(':').map(Number);
            const slotDateTime = new Date(targetDate);
            slotDateTime.setHours(hours, minutes, 0, 0);

            // Check if disabled by owner
            const isDisabled = await this.roomDisablePeriodService.isRoomDisabledAt(room.id, slotDateTime);
            
            // Check if booked by customer
            const isBooked = reservedSlots.includes(rate.timeSlot);

            return {
              ...rate,
              isDisabled,
              isBooked,
            };
          })
        );

        return {
          ...room,
          timeSlotRates: enhancedTimeSlotRates,
        };
      })
    );

    return enhancedRooms;
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

    // Get disabled slots for the specific date
    const disabledSlots: string[] = [];
    for (const slot of operatingHoursSlots) {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotDateTime = new Date(targetDate);
      slotDateTime.setHours(hours, minutes, 0, 0);

      const isDisabled = await this.roomDisablePeriodService.isRoomDisabledAt(roomId, slotDateTime);
      if (isDisabled) {
        disabledSlots.push(slot);
      }
    }

    // Calculate available slots (within operating hours, not reserved, and not disabled)
    const availableSlots = operatingHoursSlots.filter(slot => 
      !reservedSlots.includes(slot) && !disabledSlots.includes(slot)
    );

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