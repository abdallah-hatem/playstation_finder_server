import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { IsNotEmpty, IsNumber, IsEnum, IsDateString } from "class-validator";
import { Room } from "./room.entity";
import { User } from "./user.entity";
import { ReservationSlot } from "./reservation-slot.entity";
import {
  ReservationStatus,
  ReservationType,
} from "../common/enums/reservation-type.enum";

@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "room_id" })
  roomId: string;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ type: "date" })
  @IsDateString()
  date: Date;

  @Column({ type: "enum", enum: ReservationType })
  @IsEnum(ReservationType)
  type: ReservationType;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "total_price" })
  @IsNumber()
  totalPrice: number;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: "room_id" })
  room: Room;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => ReservationSlot, (slot) => slot.reservation, {
    cascade: true,
  })
  slots: ReservationSlot[];

  @Column({ 
    type: "enum", 
    enum: ReservationStatus,
    default: ReservationStatus.PENDING 
  })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
