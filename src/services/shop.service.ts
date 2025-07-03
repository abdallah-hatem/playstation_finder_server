import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ShopRepository } from '../repositories/shop.repository';
import { OwnerRepository } from '../repositories/owner.repository';
import { CreateShopDto, CreateShopWithImagesDto, UpdateShopWithImagesDto } from '../dto/create-shop.dto';
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

  async createWithImages(
    createShopDto: CreateShopWithImagesDto, 
    files: { image?: Express.Multer.File[], images?: Express.Multer.File[] }, 
    ownerId: string
  ): Promise<Shop> {
    // Create shop first (exclude image files from DTO)
    const { image, images, ...shopData } = createShopDto;
    const shop = await this.shopRepository.create({
      ...shopData,
      ownerId,
    });

    let mainImagePath: string | undefined;
    let additionalImagePaths: string[] = [];

    // Handle main image
    if (files.image && files.image.length > 0) {
      mainImagePath = `/public/uploads/shops/${files.image[0].filename}`;
    }

    // Handle additional images
    if (files.images && files.images.length > 0) {
      additionalImagePaths = files.images.map(file => `/public/uploads/shops/${file.filename}`);
    }

    // Update shop with images if any were uploaded
    if (mainImagePath || additionalImagePaths.length > 0) {
      await this.shopRepository.update(shop.id, {
        image: mainImagePath,
        images: additionalImagePaths.length > 0 ? additionalImagePaths : undefined,
      });

      // Return updated shop
      return await this.shopRepository.findById(shop.id) as Shop;
    }

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

  async updateWithImages(
    id: string, 
    updateData: UpdateShopWithImagesDto, 
    files: { image?: Express.Multer.File[], images?: Express.Multer.File[] }, 
    ownerId: string
  ): Promise<Shop> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Check if the current owner owns this shop
    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own shops');
    }

    // Prepare update data (exclude image files from DTO)
    const { image, images, ...shopData } = updateData;
    const updateObject: any = { ...shopData };

    // Handle main image replacement
    if (files.image && files.image.length > 0) {
      updateObject.image = `/public/uploads/shops/${files.image[0].filename}`;
    }

    // Handle gallery images replacement (completely replaces existing)
    if (files.images && files.images.length > 0) {
      updateObject.images = files.images.map(file => `/public/uploads/shops/${file.filename}`);
    }

    // Update shop
    const updatedShop = await this.shopRepository.update(id, updateObject);
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

  async updateMainImage(id: string, imagePath: string | null, ownerId: string): Promise<Shop> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Check if the current owner owns this shop
    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own shops');
    }

    const updatedShop = await this.shopRepository.update(id, { image: imagePath });
    return updatedShop!;
  }

  async addImages(id: string, imagePaths: string[], ownerId: string): Promise<Shop> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Check if the current owner owns this shop
    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own shops');
    }

    // Merge new images with existing ones
    const existingImages = shop.images || [];
    const newImages = [...existingImages, ...imagePaths];

    const updatedShop = await this.shopRepository.update(id, { images: newImages });
    return updatedShop!;
  }

  async removeImage(id: string, imageIndex: number, ownerId: string): Promise<Shop> {
    const shop = await this.shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Check if the current owner owns this shop
    if (shop.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own shops');
    }

    const existingImages = shop.images || [];
    if (imageIndex < 0 || imageIndex >= existingImages.length) {
      throw new NotFoundException('Image not found at the specified index');
    }

    // Remove image at specified index
    const newImages = existingImages.filter((_, index) => index !== imageIndex);

    const updatedShop = await this.shopRepository.update(id, { images: newImages });
    return updatedShop!;
  }
} 