import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerService } from '../services/owner.service';
import { OwnerController } from '../controllers/owner.controller';
import { OwnerRepository } from '../repositories/owner.repository';
import { Owner } from '../entities/owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Owner])],
  controllers: [OwnerController],
  providers: [OwnerService, OwnerRepository],
  exports: [OwnerService, OwnerRepository],
})
export class OwnerModule {} 