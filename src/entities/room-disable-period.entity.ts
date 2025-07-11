import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { Room } from './room.entity';
import { Owner } from './owner.entity';

@Entity('room_disable_periods')
export class RoomDisablePeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  @IsUUID()
  roomId: string;

  @Column({ name: 'owner_id' })
  @IsUUID()
  ownerId: string;

  @Column({ type: 'timestamp', name: 'start_date_time' })
  @IsNotEmpty()
  startDateTime: Date;

  @Column({ type: 'timestamp', name: 'end_date_time' })
  @IsNotEmpty()
  endDateTime: Date;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Owner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 