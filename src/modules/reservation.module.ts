import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from '../services/reservation.service';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationRepository } from '../repositories/reservation.repository';
import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';
import { Reservation } from '../entities/reservation.entity';
import { ReservationSlot } from '../entities/reservation-slot.entity';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationSlot, Room, User])],
  controllers: [ReservationController],
  providers: [ReservationService, ReservationRepository, RoomRepository, UserRepository],
  exports: [ReservationService, ReservationRepository],
})
export class ReservationModule {} 