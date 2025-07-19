import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, SelectQueryBuilder } from "typeorm";
import { Reservation } from "../entities/reservation.entity";
import { BaseRepository } from "../common/repository/base.repository";

@Injectable()
export class ReservationRepository extends BaseRepository<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>
  ) {
    super(reservationRepository);
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { userId },
      relations: ["room", "room.shop", "slots", "room.device"],
    });
  }

  async findByRoomId(roomId: string): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { roomId },
      relations: ["user", "slots"],
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Reservation[]> {
    return await this.reservationRepository
      .createQueryBuilder("reservation")
      .leftJoinAndSelect("reservation.room", "room")
      .leftJoinAndSelect("reservation.user", "user")
      .leftJoinAndSelect("reservation.slots", "slots")
      .where("reservation.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .getMany();
  }

  async findConflictingReservations(
    roomId: string,
    date: Date,
    timeSlots: string[]
  ): Promise<Reservation[]> {
    return await this.reservationRepository
      .createQueryBuilder("reservation")
      .leftJoinAndSelect("reservation.slots", "slots")
      .where("reservation.roomId = :roomId", { roomId })
      .andWhere("reservation.date = :date", { date })
      .andWhere("slots.timeSlot IN (:...timeSlots)", { timeSlots })
      .getMany();
  }

  async findFutureReservationsByOwnerId(
    ownerId: string
  ): Promise<Reservation[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    return await this.reservationRepository
      .createQueryBuilder("reservation")
      .leftJoinAndSelect("reservation.room", "room")
      .leftJoinAndSelect("room.shop", "shop")
      .leftJoinAndSelect("reservation.user", "user")
      .leftJoinAndSelect("reservation.slots", "slots")
      .where("shop.ownerId = :ownerId", { ownerId })
      .andWhere("reservation.date >= :today", { today })
      .getMany();
  }

  async findAllReservationsByOwnerId(ownerId: string): Promise<Reservation[]> {
    return await this.reservationRepository
      .createQueryBuilder("reservation")
      .leftJoinAndSelect("reservation.room", "room")
      .leftJoinAndSelect("room.shop", "shop")
      .leftJoinAndSelect("room.device", "device")
      .leftJoinAndSelect("reservation.user", "user")
      .leftJoinAndSelect("reservation.slots", "slots")
      .where("shop.ownerId = :ownerId", { ownerId })
      .orderBy("shop.name", "ASC")
      .addOrderBy("room.name", "ASC")
      .addOrderBy("reservation.date", "DESC")
      .getMany();
  }

  async findReservationsByShopId(shopId: string): Promise<Reservation[]> {
    return await this.reservationRepository
      .createQueryBuilder("reservation")
      .leftJoinAndSelect("reservation.room", "room")
      .leftJoinAndSelect("room.shop", "shop")
      .leftJoinAndSelect("reservation.user", "user")
      .leftJoinAndSelect("reservation.slots", "slots")
      .where("room.shopId = :shopId", { shopId })
      .orderBy("room.name", "ASC")
      .addOrderBy("reservation.date", "DESC")
      .getMany();
  }

  /**
   * Apply search filter to a query builder
   * Searches across user name, email, phone, room name, shop name, address, phone, and reservation type
   */
  private applySearchFilter(
    queryBuilder: SelectQueryBuilder<Reservation>,
    searchTerm: string
  ): SelectQueryBuilder<Reservation> {
    if (!searchTerm || searchTerm.trim() === '') {
      return queryBuilder;
    }

    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    return queryBuilder.andWhere(
      `(
        LOWER(user.name) LIKE :search OR 
        LOWER(user.email) LIKE :search OR 
        LOWER(user.phone) LIKE :search OR 
        LOWER(room.name) LIKE :search OR 
        LOWER(shop.name) LIKE :search OR 
        LOWER(shop.address) LIKE :search OR 
        LOWER(shop.phone) LIKE :search OR 
        LOWER(CAST(reservation.type AS TEXT)) LIKE :search OR
        LOWER(CAST(reservation.status AS TEXT)) LIKE :search OR
        CAST(reservation.totalPrice AS TEXT) LIKE :search
      )`,
      { search: searchPattern }
    );
  }

  /**
   * Find reservations by owner with search, pagination and sorting
   */
  async findByOwnerWithSearchAndPagination(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
    searchTerm?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    shopId?: string,
    status?: string
  ): Promise<{ data: Reservation[]; total: number }> {
    let queryBuilder = this.reservationRepository
      .createQueryBuilder("reservation")
      .leftJoinAndSelect("reservation.room", "room")
      .leftJoinAndSelect("room.shop", "shop")
      .leftJoinAndSelect("room.device", "device")
      .leftJoinAndSelect("reservation.user", "user")
      .leftJoinAndSelect("reservation.slots", "slots")
      .where("shop.ownerId = :ownerId", { ownerId });

    // Apply shop filter if provided
    if (shopId) {
      queryBuilder = queryBuilder.andWhere("shop.id = :shopId", { shopId });
    }

    // Apply status filter if provided
    if (status) {
      queryBuilder = queryBuilder.andWhere("reservation.status = :status", { status });
    }

    // Apply search filter
    queryBuilder = this.applySearchFilter(queryBuilder, searchTerm);

    // Apply sorting
    const validSortFields = ['createdAt', 'date', 'totalPrice', 'type'];
    const sortField = validSortFields.includes(sortBy) ? `reservation.${sortBy}` : 'reservation.createdAt';
    queryBuilder = queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(offset).take(limit);

    // Get results and count
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  /**
   * Find reservations by user with search, pagination and sorting
   */
  async findByUserWithSearchAndPagination(
    userId: string,
    page: number = 1,
    limit: number = 10,
    searchTerm?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    status?: string,
    shopId?: string
  ): Promise<{ data: Reservation[]; total: number }> {
    let queryBuilder = this.reservationRepository
      .createQueryBuilder("reservation")
      .leftJoinAndSelect("reservation.room", "room")
      .leftJoinAndSelect("room.shop", "shop")
      .leftJoinAndSelect("room.device", "device")
      .leftJoinAndSelect("reservation.user", "user")
      .leftJoinAndSelect("reservation.slots", "slots")
      .where("reservation.userId = :userId", { userId });

    // Apply shopId filter if provided
    if (shopId) {
      queryBuilder = queryBuilder.andWhere("shop.id = :shopId", { shopId });
    }

    // Apply status filter if provided
    if (status) {
      queryBuilder = queryBuilder.andWhere("reservation.status = :status", { status });
    }

    // Apply search filter
    queryBuilder = this.applySearchFilter(queryBuilder, searchTerm);

    // Apply sorting
    const validSortFields = ['createdAt', 'date', 'totalPrice', 'type'];
    const sortField = validSortFields.includes(sortBy) ? `reservation.${sortBy}` : 'reservation.createdAt';
    queryBuilder = queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(offset).take(limit);

    // Get results and count
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }
}
