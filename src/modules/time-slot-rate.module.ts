import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TimeSlotRateService } from '../services/time-slot-rate.service';
import { TimeSlotRateController } from '../controllers/time-slot-rate.controller';
import { TimeSlotRateRepository } from '../repositories/time-slot-rate.repository';
import { RoomRepository } from '../repositories/room.repository';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { TimeSlotRate } from '../entities/time-slot-rate.entity';
import { Room } from '../entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlotRate, Room]), JwtModule],
  controllers: [TimeSlotRateController],
  providers: [TimeSlotRateService, TimeSlotRateRepository, RoomRepository, OwnerOnlyGuard],
  exports: [TimeSlotRateService, TimeSlotRateRepository],
})
export class TimeSlotRateModule {} 