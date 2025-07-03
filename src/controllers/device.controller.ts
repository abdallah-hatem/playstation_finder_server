import {
  Controller,
  Get,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ApiResponseSuccess } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';

@ApiTags('devices')
@Controller('devices')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all devices (owner only)' })
  @ApiResponseSuccess({ message: 'Devices retrieved successfully' })
  async findAll() {
    return await this.deviceRepository.find();
  }
} 