import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../entities/device.entity';
import { DeviceSeedService } from '../services/device-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  providers: [DeviceSeedService],
  exports: [DeviceSeedService],
})
export class DeviceSeedModule {} 