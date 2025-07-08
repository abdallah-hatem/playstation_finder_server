import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OtpRepository } from '../repositories/otp.repository';
import { UserRepository } from '../repositories/user.repository';
import { OwnerRepository } from '../repositories/owner.repository';
import { SendOtpDto, VerifyOtpDto } from '../dto/send-otp.dto';
import { OTP } from '../entities/otp.entity';

@Injectable()
export class OtpService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly userRepository: UserRepository,
    private readonly ownerRepository: OwnerRepository,
    private readonly configService: ConfigService,
  ) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter(): void {
    // Initialize NodeMailer transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail service instead of manual SMTP config
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  private generateOtpCode(): string {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ message: string }> {
    const { email, userType, purpose = 'email_verification' } = sendOtpDto;

    // Check if user/owner exists with this email
    let userExists = false;
    if (userType === 'user') {
      const user = await this.userRepository.findByEmail(email);
      userExists = !!user;
    } else {
      const owner = await this.ownerRepository.findByEmail(email);
      userExists = !!owner;
    }

    if (!userExists) {
      throw new NotFoundException(`${userType} with this email not found`);
    }

    // Check if there's a recent OTP (rate limiting)
    const latestOtp = await this.otpRepository.findLatestOtp(email, userType, purpose);
    if (latestOtp) {
      const timeSinceLastOtp = Date.now() - latestOtp.createdAt.getTime();
      const cooldownPeriod = 60 * 1000; // 1 minute cooldown
      
      if (timeSinceLastOtp < cooldownPeriod) {
        const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastOtp) / 1000);
        throw new BadRequestException(`Please wait ${remainingTime} seconds before requesting another OTP`);
      }
    }

    // Delete any existing OTPs for this user/email/purpose
    await this.otpRepository.deleteOtpsForUser(email, userType, purpose);

    // Generate new OTP
    const code = this.generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Save OTP to database
    const otp = await this.otpRepository.create({
      email,
      code,
      userType,
      purpose,
      expiresAt,
      isUsed: false,
    });

    // Send email (mock implementation - replace with actual email service)
    await this.sendOtpEmail(email, code, purpose);

    return {
      message: `OTP sent successfully to ${email}`,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string; isValid: boolean }> {
    const { email, code, userType, purpose = 'email_verification' } = verifyOtpDto;

    // Find valid OTP
    const otp = await this.otpRepository.findValidOtp(email, code, userType, purpose);

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Check if OTP is expired
    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    // Mark OTP as used
    await this.otpRepository.markAsUsed(otp.id);

    // If purpose is email verification, update user/owner email verification status
    if (purpose === 'email_verification') {
      if (userType === 'user') {
        const user = await this.userRepository.findByEmail(email);
        if (user) {
          await this.userRepository.update(user.id, { emailVerified: true });
        }
      } else {
        const owner = await this.ownerRepository.findByEmail(email);
        if (owner) {
          await this.ownerRepository.update(owner.id, { emailVerified: true });
        }
      }
    }

    return {
      message: 'OTP verified successfully',
      isValid: true,
    };
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.otpRepository.deleteExpiredOtps();
  }

  private async sendOtpEmail(email: string, code: string, purpose: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', 'noreply@playstation-finder.com'),
        to: email,
        subject: `Your OTP Code for ${purpose.replace('_', ' ')}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">PlayStation Finder - Email Verification</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0070f3; margin-top: 0;">Your OTP Code</h3>
              <p style="font-size: 16px; color: #333;">
                Your verification code is:
              </p>
              <div style="background-color: #0070f3; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 6px; letter-spacing: 3px;">
                ${code}
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                This code will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.
              </p>
            </div>
            <p style="font-size: 12px; color: #999; text-align: center;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
        text: `Your OTP code for ${purpose.replace('_', ' ')} is: ${code}. This code will expire in 10 minutes.`,
      };

      await this.transporter.sendMail(mailOptions);
      
      console.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // Fall back to console logging for development
      console.log(`
        ========================
        EMAIL SENDING FAILED - Displaying OTP for Development
        ========================
        To: ${email}
        Subject: Your OTP Code for ${purpose}
        Code: ${code}
        Error: ${error.message}
        ========================
      `);
      // Don't throw error to allow development without email configuration
    }
  }
} 