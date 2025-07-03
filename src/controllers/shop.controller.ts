import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseUUIDPipe,
  Query,
  ParseFloatPipe,
  UseGuards,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ShopService } from '../services/shop.service';
import { CreateShopDto, CreateShopWithImagesDto, UpdateShopWithImagesDto } from '../dto/create-shop.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { CurrentOwner } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Owner } from '../entities/owner.entity';
import { multerConfig, multipleImagesConfig } from '../config/multer.config';

@ApiTags('shops')
@Controller('shops')
@UseInterceptors(ResponseInterceptor)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  // @Post()
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Create a new shop (owner only)' })
  // @ApiResponseSuccess({ message: 'Shop created successfully' })
  // create(@Body() createShopDto: CreateShopDto, @CurrentOwner() owner: Owner) {
  //   return this.shopService.create(createShopDto, owner.id);
  // }

  @Post()
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new shop with images (owner only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Shop data with image files',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Shop name' },
        address: { type: 'string', description: 'Shop address' },
        lat: { type: 'string', description: 'Latitude coordinate' },
        long: { type: 'string', description: 'Longitude coordinate' },
        phone: { type: 'string', description: 'Shop phone number' },
        image: { 
          type: 'string', 
          format: 'binary', 
          description: 'Main shop image' 
        },
        images: { 
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Additional shop images for gallery' 
        }
      }
    }
  })
  @ApiResponseSuccess({ message: 'Shop with images created successfully' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ], multipleImagesConfig))
  createWithImages(
    @Body() createShopDto: CreateShopWithImagesDto,
    @UploadedFiles() files: { image?: Express.Multer.File[], images?: Express.Multer.File[] },
    @CurrentOwner() owner: Owner,
  ) {
    return this.shopService.createWithImages(createShopDto, files, owner.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get shops for authenticated owner' })
  @ApiResponseSuccess({ message: 'Owner shops retrieved successfully' })
  findMyShops(@CurrentOwner() owner: Owner) {
    return this.shopService.findByOwner(owner.id);
  }

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Get all shops (public)' })
  @ApiQuery({ name: 'deviceId', description: 'Filter by device ID', required: false })
  @ApiQuery({ name: 'device', description: 'Filter by device name (case-insensitive)', required: false })
  @ApiResponseSuccess({ message: 'All shops retrieved successfully' })
  findAll(
    @Query('deviceId') deviceId?: string,
    @Query('device') device?: string,
  ) {
    return this.shopService.findAll(deviceId, device);
  }


  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Find shops nearby location' })
  @ApiQuery({ name: 'lat', description: 'Latitude' })
  @ApiQuery({ name: 'long', description: 'Longitude' })
  @ApiQuery({ name: 'radius', description: 'Search radius in km', required: false })
  @ApiResponseSuccess({ message: 'Nearby shops retrieved successfully' })
  findNearby(
    @Query('lat') lat: string,
    @Query('long') long: string,
    @Query('radius') radius?: string,
  ) {
    return this.shopService.findNearby(lat, long, radius);
  }

  // @Get('owner/:ownerId')
  // @ApiOperation({ summary: 'Get shops by owner' })
  // @ApiResponseSuccess({ message: 'Owner shops retrieved successfully' })
  // findByOwner(@Param('ownerId', ParseUUIDPipe) ownerId: string) {
  //   return this.shopService.findByOwner(ownerId);
  // }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get shop by ID' })
  @ApiResponseSuccess({ message: 'Shop retrieved successfully' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopService.findOne(id);
  }

  // @Get(':id/rooms')
  // @Public()
  // @ApiOperation({ summary: 'Get shop with its rooms' })
  // @ApiResponseSuccess({ message: 'Shop with rooms retrieved successfully' })
  // findWithRooms(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.shopService.findWithRooms(id);
  // }

  // @Patch(':id')
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Update shop (owner only)' })
  // @ApiResponseSuccess({ message: 'Shop updated successfully' })
  // update(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() updateShopDto: Partial<CreateShopDto>,
  //   @CurrentOwner() owner: Owner,
  // ) {
  //   return this.shopService.update(id, updateShopDto, owner.id);
  // }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update shop with images (owner only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Shop data with image files to replace',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Shop name' },
        address: { type: 'string', description: 'Shop address' },
        lat: { type: 'string', description: 'Latitude coordinate' },
        long: { type: 'string', description: 'Longitude coordinate' },
        phone: { type: 'string', description: 'Shop phone number' },
        image: { 
          type: 'string', 
          format: 'binary', 
          description: 'Replace main shop image' 
        },
        images: { 
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Replace shop gallery images (completely replaces existing)' 
        }
      }
    }
  })
  @ApiResponseSuccess({ message: 'Shop updated with images successfully' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ], multipleImagesConfig))
  updateWithImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShopDto: UpdateShopWithImagesDto,
    @UploadedFiles() files: { image?: Express.Multer.File[], images?: Express.Multer.File[] },
    @CurrentOwner() owner: Owner,
  ) {
    return this.shopService.updateWithImages(id, updateShopDto, files, owner.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete shop (owner only)' })
  @ApiResponseSuccess({ message: 'Shop deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentOwner() owner: Owner) {
    return this.shopService.remove(id, owner.id);
  }

  // @Post(':id/upload-main-image')
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Upload main image for shop (owner only)' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   description: 'Main shop image',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       image: {
  //         type: 'string',
  //         format: 'binary',
  //         description: 'Main shop image file'
  //       }
  //     }
  //   }
  // })
  // @ApiResponseSuccess({ message: 'Main image uploaded successfully' })
  // @UseInterceptors(FileInterceptor('image', multerConfig))
  // uploadMainImage(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @UploadedFile() file: Express.Multer.File,
  //   @CurrentOwner() owner: Owner,
  // ) {
  //   if (!file) {
  //     throw new Error('No file uploaded');
  //   }
  //   const imagePath = `/public/uploads/shops/${file.filename}`;
  //   return this.shopService.updateMainImage(id, imagePath, owner.id);
  // }

  // @Post(':id/upload-images')
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Upload multiple images for shop (owner only)' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   description: 'Multiple shop images',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       images: {
  //         type: 'array',
  //         items: {
  //           type: 'string',
  //           format: 'binary'
  //         },
  //         description: 'Array of shop image files (max 10)'
  //       }
  //     }
  //   }
  // })
  // @ApiResponseSuccess({ message: 'Images uploaded successfully' })
  // @UseInterceptors(FilesInterceptor('images', 10, multipleImagesConfig))
  // uploadImages(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @UploadedFiles() files: Express.Multer.File[],
  //   @CurrentOwner() owner: Owner,
  // ) {
  //   if (!files || files.length === 0) {
  //     throw new Error('No files uploaded');
  //   }
  //   const imagePaths = files.map(file => `/public/uploads/shops/${file.filename}`);
  //   return this.shopService.addImages(id, imagePaths, owner.id);
  // }

  // @Delete(':id/image')
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Remove main image from shop (owner only)' })
  // @ApiResponseSuccess({ message: 'Main image removed successfully' })
  // removeMainImage(@Param('id', ParseUUIDPipe) id: string, @CurrentOwner() owner: Owner) {
  //   return this.shopService.updateMainImage(id, null, owner.id);
  // }

  // @Delete(':id/images/:imageIndex')
  // @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Remove specific image from shop gallery (owner only)' })
  // @ApiResponseSuccess({ message: 'Image removed successfully' })
  // removeImage(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Param('imageIndex') imageIndex: string,
  //   @CurrentOwner() owner: Owner,
  // ) {
  //   return this.shopService.removeImage(id, parseInt(imageIndex), owner.id);
  // }
} 