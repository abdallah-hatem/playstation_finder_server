import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomDisablePeriodsTable1751340000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "room_disable_periods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "start_date_time" TIMESTAMP NOT NULL,
        "end_date_time" TIMESTAMP NOT NULL,
        "reason" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_disable_periods" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "room_disable_periods" 
      ADD CONSTRAINT "FK_room_disable_periods_room" 
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "room_disable_periods" 
      ADD CONSTRAINT "FK_room_disable_periods_owner" 
      FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE
    `);

    // Add index for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_room_disable_periods_room_id" ON "room_disable_periods" ("room_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_disable_periods_owner_id" ON "room_disable_periods" ("owner_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_room_disable_periods_datetime_range" ON "room_disable_periods" ("room_id", "start_date_time", "end_date_time")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX "IDX_room_disable_periods_datetime_range"`);
    await queryRunner.query(`DROP INDEX "IDX_room_disable_periods_owner_id"`);
    await queryRunner.query(`DROP INDEX "IDX_room_disable_periods_room_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "room_disable_periods" DROP CONSTRAINT "FK_room_disable_periods_owner"`);
    await queryRunner.query(`ALTER TABLE "room_disable_periods" DROP CONSTRAINT "FK_room_disable_periods_room"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "room_disable_periods"`);
  }
} 