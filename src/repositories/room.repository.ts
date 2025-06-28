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

  async findByShopId(shopId: string): Promise<Room[]> {
    return await this.roomRepository.find({
      where: { shopId },
      relations: ['device'],
    });
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