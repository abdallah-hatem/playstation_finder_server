import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Device } from '../entities/device.entity';
import { DeviceController } from '../controllers/device.controller';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Device]), JwtModule],
  controllers: [DeviceController],
  providers: [OwnerOnlyGuard],
})
export class DeviceModule {} 