import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from '../entities/owner.entity';
import { BaseRepository } from '../common/repository/base.repository';

@Injectable()
export class OwnerRepository extends BaseRepository<Owner> {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,
  ) {
    super(ownerRepository);
  }

  async findByEmail(email: string): Promise<Owner | null> {
    return await this.ownerRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<Owner | null> {
    return await this.ownerRepository.findOne({ where: { phone } });
  }

  async findWithShops(id: string): Promise<Owner | null> {
    return await this.ownerRepository.findOne({
      where: { id },
      relations: ['shops'],
    });
  }
} 