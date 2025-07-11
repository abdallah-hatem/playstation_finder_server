import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RoomService } from '../services/room.service';
import { RoomController } from '../controllers/room.controller';
import { RoomDisablePeriodController } from '../controllers/room-disable-period.controller';
import { RoomRepository } from '../repositories/room.repository';
import { ShopRepository } from '../repositories/shop.repository';
import { OwnerRepository } from '../repositories/owner.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { RoomDisablePeriodRepository } from '../repositories/room-disable-period.repository';
import { TimeSlotRateService } from '../services/time-slot-rate.service';
import { TimeSlotRateRepository } from '../repositories/time-slot-rate.repository';
import { RoomDisablePeriodService } from '../services/room-disable-period.service';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { Room } from '../entities/room.entity';
import { Shop } from '../entities/shop.entity';
import { Owner } from '../entities/owner.entity';
import { Device } from '../entities/device.entity';
import { Reservation } from '../entities/reservation.entity';
import { ReservationSlot } from '../entities/reservation-slot.entity';
import { TimeSlotRate } from '../entities/time-slot-rate.entity';
import { RoomDisablePeriod } from '../entities/room-disable-period.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Shop, Owner, Device, Reservation, ReservationSlot, TimeSlotRate, RoomDisablePeriod]), JwtModule],
  controllers: [RoomController, RoomDisablePeriodController],
  providers: [
    RoomService, 
    RoomRepository, 
    ShopRepository, 
    OwnerRepository,
    ReservationRepository,
    RoomDisablePeriodRepository,
    RoomDisablePeriodService,
    TimeSlotRateService, 
    TimeSlotRateRepository, 
    OwnerOnlyGuard
  ],
  exports: [RoomService, RoomRepository, RoomDisablePeriodService, RoomDisablePeriodRepository],
})
export class RoomModule {} 