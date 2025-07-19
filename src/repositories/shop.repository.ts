import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

  async findByDeviceId(deviceId: string): Promise<Shop[]> {
    return await this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.owner', 'owner')
      .leftJoinAndSelect('shop.rooms', 'rooms')
      .leftJoinAndSelect('rooms.device', 'device')
      .where('rooms.deviceId = :deviceId', { deviceId })
      .getMany();
  }

  async findByDeviceName(deviceName: string): Promise<Shop[]> {
    return await this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.owner', 'owner')
      .leftJoinAndSelect('shop.rooms', 'rooms')
      .leftJoinAndSelect('rooms.device', 'device')
      .where('LOWER(device.name) LIKE LOWER(:deviceName)', { deviceName: `%${deviceName}%` })
      .getMany();
  }

  async findAllWithFilters(deviceId?: string, deviceName?: string): Promise<Shop[]> {
    const queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.owner', 'owner')
      .leftJoinAndSelect('shop.rooms', 'rooms')
      .leftJoinAndSelect('rooms.device', 'device');

    if (deviceId) {
      queryBuilder.where('rooms.deviceId = :deviceId', { deviceId });
    }

    if (deviceName) {
      const condition = deviceId ? 'andWhere' : 'where';
      queryBuilder[condition]('LOWER(device.name) LIKE LOWER(:deviceName)', { deviceName: `%${deviceName}%` });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Apply search filter to a query builder
   * Searches across shop name, address, phone, owner name, email, and device names
   */
  private applySearchFilter(
    queryBuilder: SelectQueryBuilder<Shop>,
    searchTerm: string
  ): SelectQueryBuilder<Shop> {
    if (!searchTerm || searchTerm.trim() === '') {
      return queryBuilder;
    }

    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    return queryBuilder.andWhere(
      `(
        LOWER(shop.name) LIKE :search OR 
        LOWER(shop.address) LIKE :search OR 
        LOWER(shop.phone) LIKE :search OR 
        LOWER(owner.name) LIKE :search OR 
        LOWER(owner.email) LIKE :search OR 
        LOWER(device.name) LIKE :search
      )`,
      { search: searchPattern }
    );
  }

  /**
   * Find shops by owner with search, pagination and sorting
   */
  async findByOwnerWithSearchAndPagination(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
    searchTerm?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ data: Shop[]; total: number }> {
    let queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.owner', 'owner')
      .leftJoinAndSelect('shop.rooms', 'rooms')
      .leftJoinAndSelect('rooms.device', 'device')
      .where('shop.ownerId = :ownerId', { ownerId });

    // Apply search filter
    queryBuilder = this.applySearchFilter(queryBuilder, searchTerm);

    // Apply sorting
    const validSortFields = ['createdAt', 'name', 'address', 'phone'];
    const sortField = validSortFields.includes(sortBy) ? `shop.${sortBy}` : 'shop.createdAt';
    queryBuilder = queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(offset).take(limit);

    // Get results and count
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Find all shops with search, pagination and sorting
   */
  async findAllWithSearchAndPagination(
    page: number = 1,
    limit: number = 10,
    searchTerm?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    deviceId?: string,
    deviceName?: string
  ): Promise<{ data: Shop[]; total: number }> {
    let queryBuilder = this.shopRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.owner', 'owner')
      .leftJoinAndSelect('shop.rooms', 'rooms')
      .leftJoinAndSelect('rooms.device', 'device');

    // Apply device filters
    if (deviceId) {
      queryBuilder = queryBuilder.where('rooms.deviceId = :deviceId', { deviceId });
    }

    if (deviceName) {
      const condition = deviceId ? 'andWhere' : 'where';
      queryBuilder = queryBuilder[condition]('LOWER(device.name) LIKE LOWER(:deviceName)', { 
        deviceName: `%${deviceName}%` 
      });
    }

    // Apply search filter
    queryBuilder = this.applySearchFilter(queryBuilder, searchTerm);

    // Apply sorting
    const validSortFields = ['createdAt', 'name', 'address', 'phone'];
    const sortField = validSortFields.includes(sortBy) ? `shop.${sortBy}` : 'shop.createdAt';
    queryBuilder = queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(offset).take(limit);

    // Get results and count
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }
} 