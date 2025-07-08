import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('otps')
export class OTP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  code: string;

  @Column({ type: 'enum', enum: ['user', 'owner'] })
  userType: 'user' | 'owner';

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  ownerId?: string;

  @Column({ type: 'enum', enum: ['email_verification', 'password_reset'], default: 'email_verification' })
  purpose: 'email_verification' | 'password_reset';

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 