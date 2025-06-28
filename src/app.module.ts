import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import databaseConfig from './config/database.config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './modules/auth.module';
import { OwnerModule } from './modules/owner.module';
import { UserModule } from './modules/user.module';
import { ShopModule } from './modules/shop.module';
import { DeviceModule } from './modules/device.module';
import { RoomModule } from './modules/room.module';
import { ReservationModule } from './modules/reservation.module';
import { DeviceSeedModule } from './modules/device-seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('database'),
    }),
    AuthModule,
    OwnerModule,
    UserModule,
    ShopModule,
    DeviceModule,
    RoomModule,
    ReservationModule,
    DeviceSeedModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {} 