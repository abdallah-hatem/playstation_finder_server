import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRoomRatesNullable1751117537458 implements MigrationInterface {
    name = 'UpdateRoomRatesNullable1751117537458'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rooms" ALTER COLUMN "single_hourly_rate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rooms" ALTER COLUMN "multi_hourly_rate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rooms" ALTER COLUMN "other_hourly_rate" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rooms" ALTER COLUMN "other_hourly_rate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rooms" ALTER COLUMN "multi_hourly_rate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rooms" ALTER COLUMN "single_hourly_rate" SET NOT NULL`);
    }

}
