import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { Reservation } from './reservation.entity';

@Entity('reservation_slots')
export class ReservationSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id' })
  reservationId: string;

  @Column({ name: 'time_slot' })
  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @ManyToOne(() => Reservation, (reservation) => reservation.slots)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 