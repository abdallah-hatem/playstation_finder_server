import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Cyber Café Booking API')
    .setDescription('API for managing cyber café bookings and reservations')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints (login, register)')
    .addTag('owners', 'Owner management endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('shops', 'Shop management endpoints')
    .addTag('devices', 'Device list endpoint')
    .addTag('rooms', 'Room management endpoints')
    .addTag('reservations', 'Reservation management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Download Swagger JSON as file
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cyber-cafe-api.json"');
    res.json(document);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}

bootstrap(); 