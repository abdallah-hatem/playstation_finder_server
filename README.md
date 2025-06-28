# Cyber Café Booking API

A comprehensive NestJS application for managing cyber café bookings and reservations with PostgreSQL, TypeORM, and Docker.

## 🚀 Features

- **Owner Management**: CRUD operations for café owners
- **User Management**: Customer registration and management
- **Shop Management**: Café location and details management
- **Device Management**: Gaming devices and equipment tracking
- **Room Management**: Individual gaming room management with pricing
- **Reservation System**: Time slot booking with conflict detection
- **Price Calculation**: Dynamic pricing based on reservation type
- **Database Relationships**: Proper foreign key relationships and constraints
- **Input Validation**: Comprehensive validation using class-validator
- **API Documentation**: Swagger/OpenAPI documentation
- **Error Handling**: Standardized error responses
- **Repository Pattern**: Clean architecture with repository pattern
- **Database Seeding**: Faker-generated test data

## 🛠 Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Authentication**: bcrypt password hashing
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest (configured)

## 📁 Project Structure

```
src/
├── common/
│   ├── decorators/          # Custom decorators
│   ├── enums/              # Application enums
│   ├── filters/            # Exception filters
│   ├── interceptors/       # Response interceptors
│   ├── interfaces/         # TypeScript interfaces
│   └── repository/         # Base repository class
├── config/                 # Configuration files
├── controllers/            # REST API controllers
├── database/
│   ├── migrations/         # Database migrations
│   └── seeds/              # Database seeding scripts
├── dto/                    # Data Transfer Objects
├── entities/               # TypeORM entities
├── modules/               # NestJS modules
├── repositories/          # Repository classes
├── services/              # Business logic services
├── app.module.ts          # Main application module
└── main.ts               # Application entry point
```

## 🐳 Quick Start with Docker

### Prerequisites

- Docker
- Docker Compose

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cyber-cafe-booking
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations**
   ```bash
   docker-compose exec app npm run migration:run
   ```

5. **Seed the database (optional)**
   ```bash
   docker-compose exec app npm run seed
   ```

6. **Access the application**
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api
   - PostgreSQL: localhost:5432

## 🖥 Local Development

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb cyber_cafe_db
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run migrations**
   ```bash
   npm run migration:run
   ```

5. **Seed database (optional)**
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run start:dev
   ```

## 📋 Available Scripts

```bash
# Development
npm run start:dev          # Start in development mode
npm run start:debug        # Start in debug mode

# Building
npm run build             # Build the application
npm run start:prod        # Start in production mode

# Database
npm run migration:generate # Generate new migration
npm run migration:run     # Run pending migrations
npm run migration:revert  # Revert last migration
npm run seed             # Seed database with test data

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run test:cov         # Run tests with coverage

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
```

## 📊 Database Schema

### Entities

- **Owner**: Café owners with authentication
- **User**: Customers who make reservations
- **Shop**: Café locations with geographic coordinates
- **Device**: Gaming devices (PS4, PS5, etc.)
- **Room**: Individual gaming rooms with pricing
- **Reservation**: Booking records with pricing
- **ReservationSlot**: Time slots for reservations

### Relationships

- Owner → Shops (One-to-Many)
- Shop → Rooms (One-to-Many)
- Device → Rooms (One-to-Many)
- User → Reservations (One-to-Many)
- Room → Reservations (One-to-Many)
- Reservation → ReservationSlots (One-to-Many)

## 🔧 API Endpoints

### Owners
- `POST /owners` - Create owner
- `GET /owners` - Get all owners
- `GET /owners/:id` - Get owner by ID
- `GET /owners/:id/shops` - Get owner with shops
- `PATCH /owners/:id` - Update owner
- `DELETE /owners/:id` - Delete owner

### Users
- `POST /users` - Create user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Shops
- `POST /shops` - Create shop
- `GET /shops` - Get all shops
- `GET /shops/:id` - Get shop by ID
- `GET /shops/owner/:ownerId` - Get shops by owner
- `GET /shops/nearby` - Find nearby shops
- `PATCH /shops/:id` - Update shop
- `DELETE /shops/:id` - Delete shop

### Devices
- `POST /devices` - Create device
- `GET /devices` - Get all devices
- `GET /devices/:id` - Get device by ID
- `PATCH /devices/:id` - Update device
- `DELETE /devices/:id` - Delete device

### Rooms
- `POST /rooms` - Create room
- `GET /rooms` - Get all rooms
- `GET /rooms/:id` - Get room by ID
- `GET /rooms/shop/:shopId` - Get rooms by shop
- `GET /rooms/available` - Get available rooms
- `PATCH /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

### Reservations
- `POST /reservations` - Create reservation
- `GET /reservations` - Get all reservations
- `GET /reservations/:id` - Get reservation by ID
- `GET /reservations/user/:userId` - Get user reservations
- `GET /reservations/room/:roomId` - Get room reservations
- `DELETE /reservations/:id` - Delete reservation

## 🔒 Environment Variables

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password123
DATABASE_NAME=cyber_cafe_db

# Application Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key

# Bcrypt Configuration
BCRYPT_ROUNDS=10
```

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Service and controller testing
- **Integration Tests**: Database integration testing
- **E2E Tests**: End-to-end API testing

Run tests with:
```bash
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

## 📝 API Documentation

Comprehensive API documentation is available via Swagger UI at:
- **Local**: http://localhost:3000/api
- **Docker**: http://localhost:3000/api

The documentation includes:
- Request/response schemas
- Validation rules
- Example requests
- Error responses

## 🔄 Migration Management

Generate new migrations when entities change:

```bash
# Generate migration
npm run migration:generate

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🌱 Database Seeding

The project includes a comprehensive seeding script that creates:
- 5 sample owners
- 20 sample users  
- 6 device types
- 10 shops with geographic coordinates
- 30-80 rooms across shops
- 30 sample reservations with time slots

Run seeding:
```bash
npm run seed
```

## 🚀 Deployment

### Docker Production

```bash
# Build production image
docker build -t cyber-cafe-api .

# Run with production database
docker run -p 3000:3000 --env-file .env.production cyber-cafe-api
```

### Manual Deployment

```bash
# Build application
npm run build

# Start production server
npm run start:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚡ Performance Tips

- Use database indexing for frequently queried fields
- Implement caching for read-heavy operations
- Use connection pooling for database connections
- Consider implementing pagination for large datasets
- Monitor and optimize database queries

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists

2. **Migration Issues**
   - Check entity changes are saved
   - Verify migration files are generated correctly
   - Ensure database schema is up to date

3. **Validation Errors**
   - Check DTO validation rules
   - Verify request body format
   - Review API documentation for requirements

For more issues, check the logs:
```bash
# Docker logs
docker-compose logs app

# Local logs
npm run start:dev
``` 