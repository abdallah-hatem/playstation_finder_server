import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from '../services/room.service';
import { RoomController } from '../controllers/room.controller';
import { RoomRepository } from '../repositories/room.repository';
import { ShopRepository } from '../repositories/shop.repository';
import { Room } from '../entities/room.entity';
import { Shop } from '../entities/shop.entity';
import { Device } from '../entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Shop, Device])],
  controllers: [RoomController],
  providers: [RoomService, RoomRepository, ShopRepository],
  exports: [RoomService, RoomRepository],
})
export class RoomModule {} 