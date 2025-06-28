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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OwnerService } from '../services/owner.service';
import { CreateOwnerDto, UpdateOwnerDto } from '../dto/create-owner.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { CurrentOwner } from '../common/decorators/current-user.decorator';
import { Owner } from '../entities/owner.entity';

@ApiTags('owners')
@Controller('owners')
@UseInterceptors(ResponseInterceptor)
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  // @Post()
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Create a new owner' })
  // @ApiResponseSuccess({ message: 'Owner created successfully' })
  // create(@Body() createOwnerDto: CreateOwnerDto) {
  //   return this.ownerService.create(createOwnerDto);
  // }

  // @Get()
  // @ApiOperation({ summary: 'Get all owners' })
  // @ApiResponseSuccess({ message: 'Owners retrieved successfully' })
  // findAll() {
  //   return this.ownerService.findAll();
  // }

  // @Get(':id')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get owner by ID' })
  // @ApiResponseSuccess({ message: 'Owner retrieved successfully' })
  // findOne(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.ownerService.findOne(id);
  // }

  // @Get(':id/shops')
  // @ApiOperation({ summary: 'Get owner with their shops' })
  // @ApiResponseSuccess({ message: 'Owner with shops retrieved successfully' })
  // findWithShops(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.ownerService.findWithShops(id);
  // }

  @Patch('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current owner profile' })
  @ApiResponseSuccess({ message: 'Owner profile updated successfully' })
  updateMe(
    @CurrentOwner() currentOwner: Owner,
    @Body() updateOwnerDto: UpdateOwnerDto,
  ) {
    return this.ownerService.update(currentOwner.id, updateOwnerDto);
  }

  @Delete('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete current owner account' })
  @ApiResponseSuccess({ message: 'Owner account deleted successfully' })
  deleteMe(@CurrentOwner() currentOwner: Owner) {
    return this.ownerService.remove(currentOwner.id);
  }
} 