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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Owner } from '../entities/owner.entity';

@ApiTags('shops')
@Controller('shops')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new shop' })
  @ApiResponseSuccess({ message: 'Shop created successfully' })
  create(@Body() createShopDto: CreateShopDto, @CurrentUser() owner: Owner) {
    return this.shopService.create(createShopDto, owner.id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shops for authenticated owner' })
  @ApiResponseSuccess({ message: 'Owner shops retrieved successfully' })
  findMyShops(@CurrentUser() owner: Owner) {
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shop' })
  @ApiResponseSuccess({ message: 'Shop updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShopDto: Partial<CreateShopDto>,
  ) {
    return this.shopService.update(id, updateShopDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete shop' })
  @ApiResponseSuccess({ message: 'Shop deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopService.remove(id);
  }
} 