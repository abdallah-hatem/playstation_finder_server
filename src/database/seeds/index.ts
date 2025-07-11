import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Owner } from '../../entities/owner.entity';
import { User } from '../../entities/user.entity';
import { Device } from '../../entities/device.entity';
import { Shop } from '../../entities/shop.entity';
import { Room } from '../../entities/room.entity';
import { Reservation } from '../../entities/reservation.entity';
import { ReservationSlot } from '../../entities/reservation-slot.entity';
import { ReservationType } from '../../common/enums/reservation-type.enum';

async function seed() {
  try {
    await AppDataSource.initialize();

    console.log('🌱 Starting database seeding...');

    // Create Devices
    const devices = await createDevices();
    console.log(`✅ Created ${devices.length} devices`);

    // Create Owners
    const owners = await createOwners();
    console.log(`✅ Created ${owners.length} owners`);

    // Create Users
    const users = await createUsers();
    console.log(`✅ Created ${users.length} users`);

    // Create Shops
    const shops = await createShops(owners);
    console.log(`✅ Created ${shops.length} shops`);

    // Create Rooms
    const rooms = await createRooms(shops, devices);
    console.log(`✅ Created ${rooms.length} rooms`);

    // Create Reservations with Slots
    const reservations = await createReservations(rooms, users);
    console.log(`✅ Created ${reservations.length} reservations`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function createDevices(): Promise<Device[]> {
  const deviceRepository = AppDataSource.getRepository(Device);
  
  const deviceNames = ['PlayStation 4', 'PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'PC Gaming', 'beIN Sports'];
  const devices = [];

  for (const name of deviceNames) {
    const device = deviceRepository.create({ name });
    devices.push(await deviceRepository.save(device));
  }

  return devices;
}

async function createOwners(): Promise<Owner[]> {
  const ownerRepository = AppDataSource.getRepository(Owner);
  const owners = [];

  for (let i = 0; i < 5; i++) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const owner = ownerRepository.create({
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      passwordHash,
    });
    owners.push(await ownerRepository.save(owner));
  }

  return owners;
}

async function createUsers(): Promise<User[]> {
  const userRepository = AppDataSource.getRepository(User);
  const users = [];

  for (let i = 0; i < 20; i++) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = userRepository.create({
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      passwordHash,
    });
    users.push(await userRepository.save(user));
  }

  return users;
}

async function createShops(owners: Owner[]): Promise<Shop[]> {
  const shopRepository = AppDataSource.getRepository(Shop);
  const shops = [];

  for (let i = 0; i < 10; i++) {
    const owner = faker.helpers.arrayElement(owners);
    
    // Generate random but realistic opening and closing times
    const openingHour = faker.number.int({ min: 6, max: 10 }); // 6 AM to 10 AM
    const closingHour = faker.number.int({ min: 20, max: 23 }); // 8 PM to 11 PM
    
    const shop = shopRepository.create({
      ownerId: owner.id,
      name: `${faker.company.name()} Gaming Café`,
      address: faker.location.streetAddress(),
      lat: faker.location.latitude().toString(),
      long: faker.location.longitude().toString(),
      phone: faker.phone.number(),
      openingTime: `${openingHour.toString().padStart(2, '0')}:00`,
      closingTime: `${closingHour.toString().padStart(2, '0')}:00`,
    });
    shops.push(await shopRepository.save(shop));
  }

  return shops;
}

async function createRooms(shops: Shop[], devices: Device[]): Promise<Room[]> {
  const roomRepository = AppDataSource.getRepository(Room);
  const rooms = [];

  for (const shop of shops) {
    for (let i = 0; i < faker.number.int({ min: 3, max: 8 }); i++) {
      const device = faker.helpers.arrayElement(devices);
      // Randomly choose pricing model: either single+multi or other only
      const useSingleMulti = faker.datatype.boolean();
      
      const room = roomRepository.create({
        shopId: shop.id,
        name: `Room ${i + 1}`,
        capacity: faker.number.int({ min: 1, max: 6 }),
        deviceId: device.id,
        singleHourlyRate: useSingleMulti ? parseFloat(faker.commerce.price({ min: 5, max: 15 })) : null,
        multiHourlyRate: useSingleMulti ? parseFloat(faker.commerce.price({ min: 8, max: 20 })) : null,
        otherHourlyRate: useSingleMulti ? 
          (faker.datatype.boolean() ? parseFloat(faker.commerce.price({ min: 10, max: 25 })) : null) : 
          parseFloat(faker.commerce.price({ min: 10, max: 25 })),
        isAvailable: faker.datatype.boolean(),
      });
      rooms.push(await roomRepository.save(room));
    }
  }

  return rooms;
}

async function createReservations(rooms: Room[], users: User[]): Promise<Reservation[]> {
  const reservationRepository = AppDataSource.getRepository(Reservation);
  const reservationSlotRepository = AppDataSource.getRepository(ReservationSlot);
  const reservations = [];

  for (let i = 0; i < 30; i++) {
    const room = faker.helpers.arrayElement(rooms);
    const user = faker.helpers.arrayElement(users);
    const type = faker.helpers.enumValue(ReservationType);
    
    const reservation = reservationRepository.create({
      roomId: room.id,
      userId: user.id,
      date: faker.date.soon({ days: 30 }),
      type,
      totalPrice: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
    });
    
    const savedReservation = await reservationRepository.save(reservation);
    reservations.push(savedReservation);

    // Create time slots for the reservation (full day range)
    const slotCount = faker.number.int({ min: 1, max: 4 });
    for (let j = 0; j < slotCount; j++) {
      const timeSlot = `${faker.number.int({ min: 0, max: 23 })}:${faker.helpers.arrayElement(['00', '30'])}`;
      const slot = reservationSlotRepository.create({
        reservationId: savedReservation.id,
        timeSlot,
      });
      await reservationSlotRepository.save(slot);
    }
  }

  return reservations;
}

// Run the seeding
seed(); 