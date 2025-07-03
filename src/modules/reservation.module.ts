import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ReservationService } from '../services/reservation.service';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationRepository } from '../repositories/reservation.repository';
import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { Reservation } from '../entities/reservation.entity';
import { ReservationSlot } from '../entities/reservation-slot.entity';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationSlot, Room, User]), JwtModule],
  controllers: [ReservationController],
  providers: [ReservationService, ReservationRepository, RoomRepository, UserRepository, OwnerOnlyGuard],
  exports: [ReservationService, ReservationRepository],
})
export class ReservationModule {} 