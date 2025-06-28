import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';

@Injectable()
export class DeviceSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async onModuleInit() {
    await this.seedDevices();
  }

  private async seedDevices() {
    const deviceNames = ['PS5', 'PS4', 'PS3', 'Xbox One', 'beIN Sports'];
    
    for (const name of deviceNames) {
      const existingDevice = await this.deviceRepository.findOne({ where: { name } });
      if (!existingDevice) {
        await this.deviceRepository.save({ name });
        console.log(`✅ Device "${name}" created`);
      }
    }
  }
} 