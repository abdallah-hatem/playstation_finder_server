import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RoomService } from '../services/room.service';
import { RoomController } from '../controllers/room.controller';
import { RoomRepository } from '../repositories/room.repository';
import { ShopRepository } from '../repositories/shop.repository';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { Room } from '../entities/room.entity';
import { Shop } from '../entities/shop.entity';
import { Device } from '../entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Shop, Device]), JwtModule],
  controllers: [RoomController],
  providers: [RoomService, RoomRepository, ShopRepository, OwnerOnlyGuard],
  exports: [RoomService, RoomRepository],
})
export class RoomModule {} 