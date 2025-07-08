import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from '../services/otp.service';
import { OtpRepository } from '../repositories/otp.repository';
import { UserRepository } from '../repositories/user.repository';
import { OwnerRepository } from '../repositories/owner.repository';
import { OTP } from '../entities/otp.entity';
import { User } from '../entities/user.entity';
import { Owner } from '../entities/owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OTP, User, Owner])],
  providers: [OtpService, OtpRepository, UserRepository, OwnerRepository],
  exports: [OtpService, OtpRepository],
})
export class OtpModule {} 