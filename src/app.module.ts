import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import databaseConfig from './config/database.config';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthModule } from './modules/auth.module';
import { OwnerModule } from './modules/owner.module';
import { UserModule } from './modules/user.module';
import { ShopModule } from './modules/shop.module';
import { DeviceModule } from './modules/device.module';
import { RoomModule } from './modules/room.module';
import { ReservationModule } from './modules/reservation.module';
import { DeviceSeedModule } from './modules/device-seed.module';
import { OtpModule } from './modules/otp.module';

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
    OtpModule,
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
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {} 