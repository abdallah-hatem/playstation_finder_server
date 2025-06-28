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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ShopService } from '../services/shop.service';
import { CreateShopDto } from '../dto/create-shop.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { CurrentOwner } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Owner } from '../entities/owner.entity';

@ApiTags('shops')
@Controller('shops')
@UseInterceptors(ResponseInterceptor)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new shop (owner only)' })
  @ApiResponseSuccess({ message: 'Shop created successfully' })
  create(@Body() createShopDto: CreateShopDto, @CurrentOwner() owner: Owner) {
    return this.shopService.create(createShopDto, owner.id);
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
  @ApiResponseSuccess({ message: 'All shops retrieved successfully' })
  findAll() {
    return this.shopService.findAll();
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update shop (owner only)' })
  @ApiResponseSuccess({ message: 'Shop updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShopDto: Partial<CreateShopDto>,
    @CurrentOwner() owner: Owner,
  ) {
    return this.shopService.update(id, updateShopDto, owner.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerOnlyGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete shop (owner only)' })
  @ApiResponseSuccess({ message: 'Shop deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentOwner() owner: Owner) {
    return this.shopService.remove(id, owner.id);
  }
} 