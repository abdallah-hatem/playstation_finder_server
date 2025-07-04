import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ShopService } from '../services/shop.service';
import { ShopController } from '../controllers/shop.controller';
import { ShopRepository } from '../repositories/shop.repository';
import { OwnerRepository } from '../repositories/owner.repository';
import { OwnerOnlyGuard } from '../auth/owner-only.guard';
import { Shop } from '../entities/shop.entity';
import { Owner } from '../entities/owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, Owner]), JwtModule],
  controllers: [ShopController],
  providers: [ShopService, ShopRepository, OwnerRepository, OwnerOnlyGuard],
  exports: [ShopService, ShopRepository],
})
export class ShopModule {} 