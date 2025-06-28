import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OwnerRepository } from '../repositories/owner.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { CreateOwnerDto, UpdateOwnerDto } from '../dto/create-owner.dto';
import { Owner } from '../entities/owner.entity';

@Injectable()
export class OwnerService {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(createOwnerDto: CreateOwnerDto): Promise<Owner> {
    const { email, phone, password, ...ownerData } = createOwnerDto;

    // Check if owner already exists
    const existingOwnerByEmail = await this.ownerRepository.findByEmail(email);
    if (existingOwnerByEmail) {
      throw new ConflictException('Owner with this email already exists');
    }

    const existingOwnerByPhone = await this.ownerRepository.findByPhone(phone);
    if (existingOwnerByPhone) {
      throw new ConflictException('Owner with this phone number already exists');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const owner = await this.ownerRepository.create({
      ...ownerData,
      email,
      phone,
      passwordHash,
    });

    return owner;
  }

  async findAll() {
    return await this.ownerRepository.findAll();
  }

  async findOne(id: string): Promise<Owner> {
    const owner = await this.ownerRepository.findById(id);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    return owner;
  }

  async findWithShops(id: string): Promise<Owner> {
    const owner = await this.ownerRepository.findWithShops(id);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    return owner;
  }

  async update(id: string, updateData: UpdateOwnerDto): Promise<Owner> {
    const owner = await this.ownerRepository.findById(id);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== owner.email) {
      const existingOwner = await this.ownerRepository.findByEmail(updateData.email);
      if (existingOwner) {
        throw new ConflictException('Owner with this email already exists');
      }
    }

    // Check for phone uniqueness if phone is being updated
    if (updateData.phone && updateData.phone !== owner.phone) {
      const existingOwner = await this.ownerRepository.findByPhone(updateData.phone);
      if (existingOwner) {
        throw new ConflictException('Owner with this phone number already exists');
      }
    }

    const updatedOwner = await this.ownerRepository.update(id, updateData);
    return updatedOwner!;
  }

  async remove(id: string): Promise<boolean> {
    const owner = await this.ownerRepository.findById(id);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check for future reservations across all owner's shops
    const futureReservations = await this.reservationRepository.findFutureReservationsByOwnerId(id);
    
    if (futureReservations.length > 0) {
      throw new BadRequestException(
        `Cannot delete account. You have ${futureReservations.length} future reservation(s). ` +
        `Please cancel all future reservations before deleting your account or contact support.`
      );
    }

    // If no future reservations, proceed with deletion (cascade will handle shops, rooms, and past reservations)
    return await this.ownerRepository.delete(id);
  }
} 