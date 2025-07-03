import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ShopRepository } from '../repositories/shop.repository';
import { OwnerRepository } from '../repositories/owner.repository';
import { CreateShopDto } from '../dto/create-shop.dto';
import { Shop } from '../entities/shop.entity';

@Injectable()
export class ShopService {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly ownerRepository: OwnerRepository,
  ) {}

  async create(createShopDto: CreateShopDto, ownerId: string): Promise<Shop> {
    // Owner validation is handled by JWT auth guard
    const shop = await this.shopRepository.create({
      ...createShopDto,
      ownerId,
    });

    return shop;
  }

  async findAll(deviceId?: string, deviceName?: string) {
    if (deviceId || deviceName) {
      return await this.shopRepository.findAllWithFilters(deviceId, deviceName);
    }
    return await this.shopRepository.findAll({
      relations: ['owner'],
    });
  }

  async findOne(id: string): Promise<Shop> {
    const shop = await this.shopRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async findWithRooms(id: string): Promise<Shop> {
    const shop = await this.shopRepository.findWithRooms(id);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async findByOwner(ownerId: string): Promise<Shop[]> {
    // Owner validation is handled by JWT auth guard
    return await this.shopRepository.findByOwnerId(ownerId);
  }

  async findNearby(lat: string, long: string, radius: string = '10'): Promise<Shop[]> {
    const numLat = parseFloat(lat);
    const numLong = parseFloat(long);
    const numRadius = parseFloat(radius);
    return await this.shopRepository.findNearby(numLat, numLong, numRadius);
  }

  async update(id: string, updateData: Partial<CreateShopDto>, ownerId: string): Promise<Shop> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Check if the current owner owns this shop
    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own shops');
    }

    const updatedShop = await this.shopRepository.update(id, updateData);
    return updatedShop!;
  }

  async remove(id: string, ownerId: string): Promise<boolean> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Check if the current owner owns this shop
    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only delete your own shops');
    }

    return await this.shopRepository.delete(id);
  }

  async findByDevice(deviceId: string): Promise<Shop[]> {
    return await this.shopRepository.findByDeviceId(deviceId);
  }

  async findByDeviceName(deviceName: string): Promise<Shop[]> {
    return await this.shopRepository.findByDeviceName(deviceName);
  }
} 