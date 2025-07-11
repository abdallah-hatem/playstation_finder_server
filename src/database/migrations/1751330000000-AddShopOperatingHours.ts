import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopOperatingHours1751330000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shops" 
      ADD COLUMN "opening_time" varchar NOT NULL DEFAULT '09:00',
      ADD COLUMN "closing_time" varchar NOT NULL DEFAULT '22:00'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shops" 
      DROP COLUMN "opening_time",
      DROP COLUMN "closing_time"
    `);
  }
} 