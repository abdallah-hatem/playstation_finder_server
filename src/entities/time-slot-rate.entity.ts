import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { Room } from './room.entity';

@Entity('time_slot_rates')
@Unique(['roomId', 'timeSlot']) // Ensure one rate per time slot per room
export class TimeSlotRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'time_slot' })
  @IsNotEmpty()
  @IsString()
  timeSlot: string; // Format: "04:00", "04:30", etc.

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'single_hourly_rate', nullable: true })
  @IsNumber()
  singleHourlyRate: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'multi_hourly_rate', nullable: true })
  @IsNumber()
  multiHourlyRate: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'other_hourly_rate', nullable: true })
  @IsNumber()
  otherHourlyRate: number | null;

  @ManyToOne(() => Room, (room) => room.timeSlotRates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 