import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReservationStatus1751400000000 implements MigrationInterface {
    name = 'AddReservationStatus1751400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the enum type
        await queryRunner.query(`CREATE TYPE "public"."reservations_status_enum" AS ENUM('pending', 'in_progress', 'no_show', 'completed', 'payment_success')`);
        
        // Add the status column with default value
        await queryRunner.query(`ALTER TABLE "reservations" ADD "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the column
        await queryRunner.query(`ALTER TABLE "reservations" DROP COLUMN "status"`);
        
        // Drop the enum type
        await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
    }
} 