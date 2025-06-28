import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../entities/shop.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class ShopRepository extends BaseRepository<Shop> {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {
    super(shopRepository);
  }

  async findByOwnerId(ownerId: string): Promise<Shop[]> {
    return await this.shopRepository.find({ where: { ownerId } });
  }

  async findWithRooms(id: string): Promise<Shop | null> {
    return await this.shopRepository.findOne({
      where: { id },
      relations: ['rooms', 'rooms.device'],
    });
  }

  async findNearby(lat: number, long: number, radius: number = 10): Promise<Shop[]> {
    // This is a simplified version. In production, you'd use PostGIS for proper geographic queries
    return await this.shopRepository
      .createQueryBuilder('shop')
      .where(
        `6371 * acos(cos(radians(:lat)) * cos(radians(CAST(shop.lat AS DECIMAL))) * cos(radians(CAST(shop.long AS DECIMAL)) - radians(:long)) + sin(radians(:lat)) * sin(radians(CAST(shop.lat AS DECIMAL)))) <= :radius`,
        { lat, long, radius },
      )
      .getMany();
  }
} 