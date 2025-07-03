import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { Owner } from './owner.entity';
import { Room } from './room.entity';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  address: string;

  @Column({ type: 'varchar' })
  @IsString()
  lat: string;

  @Column({ type: 'varchar' })
  @IsString()
  long: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  image?: string;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ManyToOne(() => Owner, (owner) => owner.shops)
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(() => Room, (room) => room.shop, { cascade: true })
  rooms: Room[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 