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
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Shop } from './shop.entity';
import { Device } from './device.entity';
import { Reservation } from './reservation.entity';
import { TimeSlotRate } from './time-slot-rate.entity';
import { RoomDisablePeriod } from './room-disable-period.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shop_id' })
  shopId: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  @IsNumber()
  capacity: number;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'single_hourly_rate', nullable: true })
  singleHourlyRate: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'multi_hourly_rate', nullable: true })
  multiHourlyRate: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'other_hourly_rate', nullable: true })
  otherHourlyRate: number | null;

  @Column({ name: 'is_available', default: true })
  @IsBoolean()
  isAvailable: boolean;

  @ManyToOne(() => Shop, (shop) => shop.rooms)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => Device, (device) => device.rooms)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @OneToMany(() => Reservation, (reservation) => reservation.room, { cascade: true })
  reservations: Reservation[];

  @OneToMany(() => TimeSlotRate, (timeSlotRate) => timeSlotRate.room, { cascade: true })
  timeSlotRates: TimeSlotRate[];

  @OneToMany(() => RoomDisablePeriod, (disablePeriod) => disablePeriod.room, { cascade: true })
  disablePeriods: RoomDisablePeriod[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 