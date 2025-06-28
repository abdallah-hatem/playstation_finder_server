import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerService } from '../services/owner.service';
import { OwnerController } from '../controllers/owner.controller';
import { OwnerRepository } from '../repositories/owner.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { Owner } from '../entities/owner.entity';
import { Reservation } from '../entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Owner, Reservation])],
  controllers: [OwnerController],
  providers: [OwnerService, OwnerRepository, ReservationRepository],
  exports: [OwnerService, OwnerRepository],
})
export class OwnerModule {} 