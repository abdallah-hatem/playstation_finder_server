import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OwnerRepository } from '../repositories/owner.repository';
import { UserRepository } from '../repositories/user.repository';
import { LoginOwnerDto } from '../dto/login-owner.dto';
import { RegisterOwnerDto } from '../dto/register-owner.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { Owner } from '../entities/owner.entity';
import { User } from '../entities/user.entity';

export interface JwtPayload {
  sub: string; // owner ID
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  owner: Omit<Owner, 'passwordHash'>;
}

export interface UserAuthResponse {
  access_token: string;
  user: Omit<User, 'passwordHash'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginOwnerDto: LoginOwnerDto): Promise<AuthResponse> {
    const { email, password } = loginOwnerDto;

    // Find owner by email
    const owner = await this.ownerRepository.findByEmail(email);
    if (!owner) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, owner.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: owner.id,
      email: owner.email,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password hash from response
    const { passwordHash, ...ownerWithoutPassword } = owner;

    return {
      access_token,
      owner: ownerWithoutPassword,
    };
  }

  async validateOwner(payload: JwtPayload): Promise<Owner> {
    const owner = await this.ownerRepository.findById(payload.sub);
    if (!owner) {
      throw new UnauthorizedException('Owner not found');
    }
    return owner;
  }

  async refreshToken(ownerId: string): Promise<{ access_token: string }> {
    const owner = await this.ownerRepository.findById(ownerId);
    if (!owner) {
      throw new UnauthorizedException('Owner not found');
    }

    const payload: JwtPayload = {
      sub: owner.id,
      email: owner.email,
    };

    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async registerOwner(registerOwnerDto: RegisterOwnerDto): Promise<AuthResponse> {
    const { email, password, ...ownerData } = registerOwnerDto;

    // Check if owner already exists
    const existingOwner = await this.ownerRepository.findByEmail(email);
    if (existingOwner) {
      throw new ConflictException('Owner with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create owner
    const owner = await this.ownerRepository.create({
      ...ownerData,
      email,
      passwordHash,
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: owner.id,
      email: owner.email,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password hash from response
    const { passwordHash: _, ...ownerWithoutPassword } = owner;

    return {
      access_token,
      owner: ownerWithoutPassword,
    };
  }

  async registerUser(registerUserDto: RegisterUserDto): Promise<UserAuthResponse> {
    const { email, password, ...userData } = registerUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      email,
      passwordHash,
    });

    // Generate JWT token (users can also get tokens for their bookings)
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }
} 