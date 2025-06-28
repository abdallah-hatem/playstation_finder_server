import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class RoomRepository extends BaseRepository<Room> {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {
    super(roomRepository);
  }

  async findById(id: string): Promise<Room | null> {
    // Get room with future reservations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.device', 'device')
      .leftJoinAndSelect('room.shop', 'shop')
      .leftJoinAndSelect('room.reservations', 'reservations', 'reservations.date >= :today', { today })
      .leftJoinAndSelect('reservations.slots', 'slots')
      .where('room.id = :id', { id })
      .orderBy('reservations.date', 'ASC')
      .addOrderBy('slots.timeSlot', 'ASC')
      .getOne();
  }

  async findByShopId(shopId: string): Promise<Room[]> {
    // Get rooms with future reservations (from today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.device', 'device')
      .leftJoinAndSelect('room.reservations', 'reservations', 'reservations.date >= :today', { today })
      .leftJoinAndSelect('reservations.slots', 'slots')
      .where('room.shopId = :shopId', { shopId })
      .orderBy('room.name', 'ASC')
      .addOrderBy('reservations.date', 'ASC')
      .addOrderBy('slots.timeSlot', 'ASC')
      .getMany();
  }

  async findByShopIdWithDateRange(shopId: string, startDate: Date, endDate: Date): Promise<Room[]> {
    return await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.device', 'device')
      .leftJoinAndSelect('room.reservations', 'reservations', 'reservations.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .leftJoinAndSelect('reservations.slots', 'slots')
      .where('room.shopId = :shopId', { shopId })
      .orderBy('room.name', 'ASC')
      .addOrderBy('reservations.date', 'ASC')
      .addOrderBy('slots.timeSlot', 'ASC')
      .getMany();
  }

  async findAvailableRooms(shopId?: string): Promise<Room[]> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.device', 'device')
      .where('room.isAvailable = :isAvailable', { isAvailable: true });

    if (shopId) {
      queryBuilder.andWhere('room.shopId = :shopId', { shopId });
    }

    return await queryBuilder.getMany();
  }

  async findByDeviceId(deviceId: string): Promise<Room[]> {
    return await this.roomRepository.find({
      where: { deviceId },
      relations: ['shop'],
    });
  }

  async findByOwnerId(ownerId: string): Promise<Room[]> {
    return await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.shop', 'shop')
      .leftJoinAndSelect('room.device', 'device')
      .where('shop.ownerId = :ownerId', { ownerId })
      .getMany();
  }
} 