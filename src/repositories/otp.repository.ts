import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../common/repository/base.repository';
import { OTP } from '../entities/otp.entity';

@Injectable()
export class OtpRepository extends BaseRepository<OTP> {
  constructor(
    @InjectRepository(OTP)
    private readonly otpRepository: Repository<OTP>,
  ) {
    super(otpRepository);
  }

  async findValidOtp(email: string, code: string, userType: 'user' | 'owner', purpose: 'email_verification' | 'password_reset' = 'email_verification'): Promise<OTP | null> {
    return await this.otpRepository.findOne({
      where: {
        email,
        code,
        userType,
        purpose,
        isUsed: false,
      },
    });
  }

  async findLatestOtp(email: string, userType: 'user' | 'owner', purpose: 'email_verification' | 'password_reset' = 'email_verification'): Promise<OTP | null> {
    return await this.otpRepository.findOne({
      where: {
        email,
        userType,
        purpose,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.otpRepository.update(id, { isUsed: true });
  }

  async deleteExpiredOtps(): Promise<void> {
    await this.otpRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }

  async deleteOtpsForUser(email: string, userType: 'user' | 'owner', purpose: 'email_verification' | 'password_reset' = 'email_verification'): Promise<void> {
    await this.otpRepository.delete({
      email,
      userType,
      purpose,
    });
  }
} 