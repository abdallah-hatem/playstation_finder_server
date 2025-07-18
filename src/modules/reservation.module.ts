import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ReservationService } from '../services/reservation.service';
import { ReservationStatusService } from '../services/reservation-status.service';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationRepository } from '../repositories/reservation.repository';
import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';
import { ShopRepository } from '../repositories/shop.repository';
import { RoomModule } from './room.module';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { Reservation } from '../entities/reservation.entity';
import { ReservationSlot } from '../entities/reservation-slot.entity';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { Shop } from '../entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationSlot, Room, User, Shop]), JwtModule, RoomModule],
  controllers: [ReservationController],
  providers: [ReservationService, ReservationStatusService, ReservationRepository, RoomRepository, UserRepository, ShopRepository, OwnerOnlyGuard],
  exports: [ReservationService, ReservationStatusService, ReservationRepository],
})
export class ReservationModule {} 