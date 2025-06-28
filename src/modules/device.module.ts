import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../entities/device.entity';
import { DeviceController } from '../controllers/device.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DeviceController],
})
export class DeviceModule {} 